import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

const router = Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// GET /api/employers/stats - Получить статистику по работодателям
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Получаем все отклики пользователя с информацией о вакансиях
    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      include: {
        job: true,
      },
    });

    // Группируем по компаниям
    const employerStats = new Map<string, {
      company: string;
      totalApplications: number;
      viewedCount: number;
      invitedCount: number;
      rejectedCount: number;
      vacancies: Set<string>;
      avgResponseTime: number[];
    }>();

    applications.forEach(app => {
      const company = app.job.company;

      if (!employerStats.has(company)) {
        employerStats.set(company, {
          company,
          totalApplications: 0,
          viewedCount: 0,
          invitedCount: 0,
          rejectedCount: 0,
          vacancies: new Set(),
          avgResponseTime: [],
        });
      }

      const stats = employerStats.get(company)!;
      stats.totalApplications++;
      stats.vacancies.add(app.jobId);

      // Подсчитываем статусы
      if (app.status === 'viewed') stats.viewedCount++;
      if (app.status === 'invited') stats.invitedCount++;
      if (app.status === 'rejected') stats.rejectedCount++;

      // Время отклика (если есть)
      if (app.viewedAt) {
        const responseTime = app.viewedAt.getTime() - app.sentAt.getTime();
        stats.avgResponseTime.push(responseTime);
      }
    });

    // Преобразуем в массив с расчетными метриками
    const result = Array.from(employerStats.values()).map(stats => {
      const viewRate = stats.totalApplications > 0
        ? ((stats.viewedCount / stats.totalApplications) * 100).toFixed(1)
        : '0';

      const inviteRate = stats.viewedCount > 0
        ? ((stats.invitedCount / stats.viewedCount) * 100).toFixed(1)
        : '0';

      const avgResponseTime = stats.avgResponseTime.length > 0
        ? Math.round(
            stats.avgResponseTime.reduce((sum, time) => sum + time, 0) /
            stats.avgResponseTime.length /
            (1000 * 60 * 60 * 24) // Конвертируем в дни
          )
        : null;

      return {
        company: stats.company,
        totalApplications: stats.totalApplications,
        totalVacancies: stats.vacancies.size,
        viewedCount: stats.viewedCount,
        invitedCount: stats.invitedCount,
        rejectedCount: stats.rejectedCount,
        viewRate: parseFloat(viewRate),
        inviteRate: parseFloat(inviteRate),
        avgResponseTimeDays: avgResponseTime,
      };
    });

    // Сортируем по количеству откликов
    result.sort((a, b) => b.totalApplications - a.totalApplications);

    res.json(result);
  } catch (error: any) {
    logger.error('Get employer stats error:', error);
    res.status(500).json({ error: 'Failed to get employer statistics' });
  }
});

// GET /api/employers/:company - Получить детальную информацию о работодателе
router.get('/:company', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const company = decodeURIComponent(req.params.company);

    const applications = await prisma.jobApplication.findMany({
      where: {
        userId,
        job: {
          company,
        },
      },
      include: {
        job: true,
        resume: true,
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    if (applications.length === 0) {
      return res.status(404).json({ error: 'No applications found for this employer' });
    }

    res.json({
      company,
      applications,
      totalCount: applications.length,
    });
  } catch (error: any) {
    logger.error('Get employer details error:', error);
    res.status(500).json({ error: 'Failed to get employer details' });
  }
});

export default router;
