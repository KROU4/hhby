import { Router } from 'express';
import { HHApiService } from '../services/hhApi';
import { prisma } from '../utils/db';
import { encrypt, decrypt } from '../utils/encryption';
import { generateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// GET /auth/hh - Редирект на страницу авторизации HH.ru
router.get('/hh', (req, res) => {
  const authUrl = `https://hh.ru/oauth/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.HH_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.HH_REDIRECT_URI!)}`;

  res.redirect(authUrl);
});

// GET /callback - Обработка callback от HH.ru
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    logger.info('Received authorization code, exchanging for token...');

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

// GET /auth/me - Получить информацию о текущем пользователе
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        hhUserId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
