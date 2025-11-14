import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import {
  getUserSessions,
  terminateSession,
  terminateAllSessions,
} from '../utils/sessionManager';
import {
  getUserAuditLogs,
  createAuditLog,
  AuditActions,
} from '../utils/auditLog';
import {
  getUserSubscription,
  checkDailyLimit,
} from '../utils/subscriptionManager';

const router = Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// GET /api/account/sessions - Получить активные сессии
router.get('/sessions', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const sessions = await getUserSessions(userId);

    res.json(sessions);
  } catch (error: any) {
    logger.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// DELETE /api/account/sessions/:id - Завершить сессию
router.delete('/sessions/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const sessionId = req.params.id;

    const success = await terminateSession(sessionId, userId);

    if (!success) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await createAuditLog({
      userId,
      action: AuditActions.SESSION_TERMINATED,
      resource: sessionId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Terminate session error:', error);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
});

// POST /api/account/sessions/terminate-all - Завершить все сессии кроме текущей
router.post('/sessions/terminate-all', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const currentToken = req.headers.authorization?.replace('Bearer ', '');

    const count = await terminateAllSessions(userId, currentToken);

    await createAuditLog({
      userId,
      action: AuditActions.SESSION_TERMINATED,
      details: { count, action: 'terminate_all' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, count });
  } catch (error: any) {
    logger.error('Terminate all sessions error:', error);
    res.status(500).json({ error: 'Failed to terminate sessions' });
  }
});

// GET /api/account/audit-log - Получить журнал действий
router.get('/audit-log', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { action, limit, offset } = req.query;

    const logs = await getUserAuditLogs(userId, {
      action: action as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    res.json(logs);
  } catch (error: any) {
    logger.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

// GET /api/account/subscription - Получить информацию о подписке
router.get('/subscription', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const subscription = await getUserSubscription(userId);
    const limits = await checkDailyLimit(userId);

    res.json({
      ...subscription,
      dailyLimit: limits,
    });
  } catch (error: any) {
    logger.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// GET /api/account/limits - Проверить лимиты
router.get('/limits', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const limits = await checkDailyLimit(userId);

    res.json(limits);
  } catch (error: any) {
    logger.error('Get limits error:', error);
    res.status(500).json({ error: 'Failed to get limits' });
  }
});

// GET /api/account/profile - Получить профиль пользователя
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        dailyResponsesLimit: true,
        responsesToday: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
