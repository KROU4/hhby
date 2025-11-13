import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './utils/db';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Загружаем переменные окружения
dotenv.config();

// Импортируем роуты
import authRoutes from './routes/auth';
import resumesRoutes from './routes/resumes';
import vacanciesRoutes from './routes/vacancies';
import applicationsRoutes from './routes/applications';
import settingsRoutes from './routes/settings';
import analyticsRoutes from './routes/analytics';

// Импортируем job scheduler
import './jobs/autoResponder';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Роуты
app.use('/auth', authRoutes);

// Callback endpoint для HH.ru OAuth (зарегистрирован как http://localhost:8080/callback)
app.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    logger.info('Received authorization code, exchanging for token...');

    const { HHApiService } = await import('./services/hhApi');
    const { encrypt } = await import('./utils/encryption');
    const { generateToken } = await import('./middleware/auth');
    const { prisma } = await import('./utils/db');

    const hhApi = new HHApiService();
    const tokenData = await hhApi.getAccessToken(code);

    // Получаем информацию о пользователе
    hhApi.setAccessToken(tokenData.access_token);
    const hhUser = await hhApi.getMe();

    logger.info('User info received:', hhUser);

    // Шифруем токены
    const encryptedAccessToken = encrypt(tokenData.access_token);
    const encryptedRefreshToken = encrypt(tokenData.refresh_token);
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Создаем или обновляем пользователя
    const user = await prisma.user.upsert({
      where: { hhUserId: hhUser.id },
      update: {
        email: hhUser.email,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
      },
      create: {
        hhUserId: hhUser.id,
        email: hhUser.email,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
      },
    });

    // Создаем настройки по умолчанию, если их нет
    await prisma.settings.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        enabled: false,
        maxResponsesPerDay: 200,
        useAiGeneration: false,
        scheduleEnabled: false,
      },
    });

    // Генерируем JWT токен
    const jwtToken = generateToken(user.id);

    // Редиректим на frontend с токеном
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`);

  } catch (error: any) {
    logger.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
});

app.use('/api/resumes', resumesRoutes);
app.use('/api/vacancies', vacanciesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Корневой роут
app.get('/', (req, res) => {
  res.json({
    message: 'HH Auto-Responder API',
    version: '1.0.0',
    status: 'running',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Обработка ошибок
app.use(errorHandler);

// Запуск сервера
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing server...');
  await disconnectDB();
  process.exit(0);
});

startServer();
