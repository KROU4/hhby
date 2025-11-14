import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { HHApiService } from '../services/hhApi';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import { applicationLimiter } from '../middleware/rateLimiter';
import { validateBody, createApplicationSchema } from '../middleware/validation';
import { getValidAccessToken } from '../utils/tokenRefresh';

const router = Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// POST /api/applications - Отправить отклик на вакансию
router.post('/', applicationLimiter, validateBody(createApplicationSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { vacancyId, resumeId, message } = req.body;

    // Получаем валидный access token (автоматически обновляется при необходимости)
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated with HH.ru' });
    }

    // Проверяем, что резюме принадлежит пользователю
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
      },
    });

    if (!resume || !resume.hhResumeId) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Проверяем, что вакансия существует
    const job = await prisma.job.findUnique({
      where: { hhJobId: vacancyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    // Проверяем, не отправляли ли уже отклик
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId: job.id,
        },
      },
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied to this vacancy' });
    }

    // Отправляем отклик через HH API
    const hhApi = new HHApiService(accessToken);

    const negotiation = await hhApi.applyToVacancy(
      vacancyId,
      resume.hhResumeId,
      message
    );

    // Сохраняем отклик в БД
    const application = await prisma.jobApplication.create({
      data: {
        userId,
        jobId: job.id,
        resumeId,
        letterContent: message,
        status: 'sent',
        sentAt: new Date(),
      },
    });

    // Обновляем аналитику
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.analytics.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        responsesCount: { increment: 1 },
      },
      create: {
        userId,
        date: today,
        responsesCount: 1,
        viewsCount: 0,
        invitationsCount: 0,
        rejectionsCount: 0,
      },
    });

    res.json({
      success: true,
      application,
      negotiation,
    });

  } catch (error: any) {
    logger.error('Apply to vacancy error:', error);
    res.status(500).json({ error: error.message || 'Failed to apply to vacancy' });
  }
});

// GET /api/applications - Получить список откликов
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { status } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        job: true,
        resume: true,
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    res.json(applications);
  } catch (error: any) {
    logger.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// GET /api/applications/:id - Получить конкретный отклик
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const applicationId = req.params.id;

    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        userId,
      },
      include: {
        job: true,
        resume: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error: any) {
    logger.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to get application' });
  }
});

// GET /api/applications/export/csv - Экспорт откликов в CSV
router.get('/export/csv', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      include: {
        job: true,
        resume: true,
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    // Генерируем CSV
    const csvHeader = 'Дата отклика,Вакансия,Компания,Зарплата,Город,Статус,Резюме,URL\n';
    const csvRows = applications.map(app => {
      const date = new Date(app.sentAt).toLocaleDateString('ru-RU');
      const vacancy = `"${app.job.title.replace(/"/g, '""')}"`;
      const company = `"${app.job.company.replace(/"/g, '""')}"`;
      const salary = app.job.salary ? `"${app.job.salary.replace(/"/g, '""')}"` : '';
      const location = app.job.location ? `"${app.job.location.replace(/"/g, '""')}"` : '';
      const status = app.status;
      const resume = `"${app.resume.title.replace(/"/g, '""')}"`;
      const url = app.job.url;

      return `${date},${vacancy},${company},${salary},${location},${status},${resume},${url}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Устанавливаем заголовки для скачивания файла
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="applications_${new Date().toISOString().split('T')[0]}.csv"`);

    // Добавляем BOM для корректного отображения кириллицы в Excel
    res.write('\ufeff');
    res.end(csv);
  } catch (error: any) {
    logger.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export applications' });
  }
});

// GET /api/applications/export/json - Экспорт откликов в JSON
router.get('/export/json', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      include: {
        job: true,
        resume: true,
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="applications_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(applications);
  } catch (error: any) {
    logger.error('Export JSON error:', error);
    res.status(500).json({ error: 'Failed to export applications' });
  }
});

export default router;
