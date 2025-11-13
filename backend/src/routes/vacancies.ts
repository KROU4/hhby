import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { HHApiService } from '../services/hhApi';
import { prisma } from '../utils/db';
import { decrypt } from '../utils/encryption';
import { logger } from '../utils/logger';
import { HHVacancySearchParams } from '../types';

const router = Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// GET /api/vacancies/search - Поиск вакансий
router.get('/search', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Получаем пользователя с токенами
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'User not authenticated with HH.ru' });
    }

    // Расшифровываем токен
    const accessToken = decrypt(user.accessToken);

    // Параметры поиска
    const searchParams: HHVacancySearchParams = {
      text: req.query.text as string,
      area: req.query.area as string,
      salary: req.query.salary ? parseInt(req.query.salary as string) : undefined,
      experience: req.query.experience as string,
      schedule: req.query.schedule as string,
      per_page: req.query.per_page ? parseInt(req.query.per_page as string) : 20,
      page: req.query.page ? parseInt(req.query.page as string) : 0,
    };

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

    // Получаем пользователя с токенами
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'User not authenticated with HH.ru' });
    }

    // Расшифровываем токен
    const accessToken = decrypt(user.accessToken);

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
