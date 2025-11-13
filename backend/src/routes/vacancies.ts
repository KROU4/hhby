import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { HHApiService } from '../services/hhApi';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import { HHVacancySearchParams } from '../types';
import { searchLimiter } from '../middleware/rateLimiter';
import { validateQuery, searchVacanciesSchema } from '../middleware/validation';
import { getValidAccessToken } from '../utils/tokenRefresh';

const router = Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// GET /api/vacancies/search - Поиск вакансий
router.get('/search', searchLimiter, validateQuery(searchVacanciesSchema), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Получаем валидный access token (автоматически обновляется при необходимости)
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated with HH.ru' });
    }

    // Параметры поиска уже провалидированы middleware
    const searchParams: HHVacancySearchParams = req.query as any;

    // Поиск вакансий
    const hhApi = new HHApiService(accessToken);
    const result = await hhApi.searchVacancies(searchParams);

    // Сохраняем вакансии в БД
    for (const vacancy of result.items) {
      await prisma.job.upsert({
        where: { hhJobId: vacancy.id },
        update: {
          title: vacancy.name,
          company: vacancy.employer.name,
          salary: vacancy.salary ?
            `${vacancy.salary.from || 0}-${vacancy.salary.to || 0} ${vacancy.salary.currency}` :
            null,
          location: vacancy.area.name,
          url: vacancy.alternate_url,
          description: vacancy.snippet?.requirement || vacancy.snippet?.responsibility,
          publishedAt: new Date(vacancy.published_at),
        },
        create: {
          hhJobId: vacancy.id,
          title: vacancy.name,
          company: vacancy.employer.name,
          salary: vacancy.salary ?
            `${vacancy.salary.from || 0}-${vacancy.salary.to || 0} ${vacancy.salary.currency}` :
            null,
          location: vacancy.area.name,
          url: vacancy.alternate_url,
          description: vacancy.snippet?.requirement || vacancy.snippet?.responsibility,
          publishedAt: new Date(vacancy.published_at),
        },
      });
    }

    res.json(result);
  } catch (error: any) {
    logger.error('Search vacancies error:', error);
    res.status(500).json({ error: 'Failed to search vacancies' });
  }
});

// GET /api/vacancies/:id - Получить детальную информацию о вакансии
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const vacancyId = req.params.id;

    // Получаем валидный access token (автоматически обновляется при необходимости)
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      return res.status(401).json({ error: 'User not authenticated with HH.ru' });
    }

    // Получаем вакансию из HH.ru
    const hhApi = new HHApiService(accessToken);
    const vacancy = await hhApi.getVacancy(vacancyId);

    res.json(vacancy);
  } catch (error: any) {
    logger.error('Get vacancy error:', error);
    res.status(500).json({ error: 'Failed to get vacancy' });
  }
});

// POST /api/vacancies/:id/view - Отметить вакансию как просмотренную
router.post('/:id/view', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const vacancyId = req.params.id;

    // Проверяем, что вакансия существует
    const job = await prisma.job.findUnique({
      where: { hhJobId: vacancyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    // Добавляем в историю просмотров (или обновляем время просмотра)
    const view = await prisma.vacancyView.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId: job.id,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId,
        jobId: job.id,
      },
    });

    res.json({ success: true, view });
  } catch (error: any) {
    logger.error('Mark vacancy as viewed error:', error);
    res.status(500).json({ error: 'Failed to mark vacancy as viewed' });
  }
});

// GET /api/vacancies/history - Получить историю просмотров
router.get('/history/list', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { limit = 50, offset = 0 } = req.query;

    const views = await prisma.vacancyView.findMany({
      where: { userId },
      include: {
        job: true,
      },
      orderBy: {
        viewedAt: 'desc',
      },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json(views);
  } catch (error: any) {
    logger.error('Get vacancy history error:', error);
    res.status(500).json({ error: 'Failed to get vacancy history' });
  }
});

// POST /api/vacancies/:id/favorite - Добавить в избранное
router.post('/:id/favorite', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const vacancyId = req.params.id;

    // Проверяем, что вакансия существует
    const job = await prisma.job.findUnique({
      where: { hhJobId: vacancyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    // Проверяем, не добавлена ли уже в избранное
    const existingFavorite = await prisma.vacancyFavorite.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId: job.id,
        },
      },
    });

    if (existingFavorite) {
      return res.status(400).json({ error: 'Vacancy already in favorites' });
    }

    // Добавляем в избранное
    const favorite = await prisma.vacancyFavorite.create({
      data: {
        userId,
        jobId: job.id,
      },
    });

    res.json({ success: true, favorite });
  } catch (error: any) {
    logger.error('Add to favorites error:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// DELETE /api/vacancies/:id/favorite - Удалить из избранного
router.delete('/:id/favorite', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const vacancyId = req.params.id;

    // Находим вакансию
    const job = await prisma.job.findUnique({
      where: { hhJobId: vacancyId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    // Удаляем из избранного
    await prisma.vacancyFavorite.delete({
      where: {
        userId_jobId: {
          userId,
          jobId: job.id,
        },
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Remove from favorites error:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// GET /api/vacancies/favorites/list - Получить избранные вакансии
router.get('/favorites/list', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const favorites = await prisma.vacancyFavorite.findMany({
      where: { userId },
      include: {
        job: true,
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    res.json(favorites);
  } catch (error: any) {
    logger.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

export default router;
