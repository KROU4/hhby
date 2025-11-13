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
