import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

const router = Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// GET /api/analytics - Получить аналитику
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { from, to } = req.query;

    const where: any = { userId };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const analytics = await prisma.analytics.findMany({
      where,
      orderBy: {
        date: 'asc',
      },
    });

    // Суммарная статистика
    const total = analytics.reduce(
      (acc, curr) => ({
        responses: acc.responses + curr.responsesCount,
        views: acc.views + curr.viewsCount,
        invitations: acc.invitations + curr.invitationsCount,
        rejections: acc.rejections + curr.rejectionsCount,
      }),
      { responses: 0, views: 0, invitations: 0, rejections: 0 }
    );

    res.json({
      daily: analytics,
      total,
    });
  } catch (error: any) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// GET /api/analytics/today - Получить аналитику за сегодня
router.get('/today', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await prisma.analytics.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (!analytics) {
      return res.json({
        responsesCount: 0,
        viewsCount: 0,
        invitationsCount: 0,
        rejectionsCount: 0,
      });
    }

    res.json(analytics);
  } catch (error: any) {
    logger.error('Get today analytics error:', error);
    res.status(500).json({ error: 'Failed to get today analytics' });
  }
});

export default router;
