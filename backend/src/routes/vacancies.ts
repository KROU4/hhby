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

export default router;
