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

// GET /api/analytics/range - Получить аналитику за период
router.get('/range', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { from, to } = req.query;

    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();

    const analytics = await prisma.analytics.findMany({
      where: {
        userId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const result = analytics.map(a => ({
      date: a.date.toISOString().split('T')[0],
      responsesCount: a.responsesCount,
      viewsCount: a.viewsCount,
      invitationsCount: a.invitationsCount,
      rejectionsCount: a.rejectionsCount,
    }));

    res.json(result);
  } catch (error: any) {
    logger.error('Get analytics range error:', error);
    res.status(500).json({ error: 'Failed to get analytics range' });
  }
});

// GET /api/analytics/export/csv - Экспорт аналитики в CSV
router.get('/export/csv', async (req: AuthRequest, res) => {
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

    // Генерируем CSV
    const csvHeader = 'Дата,Отклики,Просмотры,Приглашения,Отказы,Процент просмотров,Процент приглашений\n';
    const csvRows = analytics.map(a => {
      const date = new Date(a.date).toLocaleDateString('ru-RU');
      const viewRate = a.responsesCount > 0 ? ((a.viewsCount / a.responsesCount) * 100).toFixed(1) : '0';
      const inviteRate = a.viewsCount > 0 ? ((a.invitationsCount / a.viewsCount) * 100).toFixed(1) : '0';

      return `${date},${a.responsesCount},${a.viewsCount},${a.invitationsCount},${a.rejectionsCount},${viewRate}%,${inviteRate}%`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="analytics_${new Date().toISOString().split('T')[0]}.csv"`);

    res.write('\ufeff');
    res.end(csv);
  } catch (error: any) {
    logger.error('Export analytics CSV error:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

export default router;
