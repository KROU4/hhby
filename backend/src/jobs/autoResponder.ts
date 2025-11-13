import cron from 'node-cron';
import { prisma } from '../utils/db';
import { HHApiService } from '../services/hhApi';
import { decrypt } from '../utils/encryption';
import { logger } from '../utils/logger';
import { HHVacancySearchParams, SearchFilters } from '../types';

// Функция для задержки (анти-бан)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Функция для случайной задержки
const randomDelay = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Функция для генерации сопроводительного письма
const generateCoverLetter = (
  template: string,
  vacancy: any
): string => {
  let letter = template;

  // Замена переменных
  letter = letter.replace(/\{название вакансии\}/gi, vacancy.name);
  letter = letter.replace(/\{компания\}/gi, vacancy.employer.name);
  letter = letter.replace(/\{зарплата\}/gi, vacancy.salary ?
    `${vacancy.salary.from || ''}-${vacancy.salary.to || ''} ${vacancy.salary.currency}` :
    'не указана'
  );

  return letter;
};

// Основная функция автоматической рассылки
const runAutoResponder = async () => {
  try {
    logger.info('Starting auto-responder job...');

    // Получаем всех пользователей с включенными настройками
    const users = await prisma.user.findMany({
      where: {
        settings: {
          enabled: true,
        },
      },
      include: {
        settings: true,
        resumes: true,
      },
    });

    logger.info(`Found ${users.length} users with auto-responder enabled`);

    for (const user of users) {
      try {
        if (!user.accessToken || !user.settings) {
          continue;
        }

        // Проверяем лимит откликов за сегодня
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayApplications = await prisma.jobApplication.count({
          where: {
            userId: user.id,
            sentAt: {
              gte: today,
            },
          },
        });

        const maxResponses = user.settings.maxResponsesPerDay;

        if (todayApplications >= maxResponses) {
          logger.info(`User ${user.id} has reached daily limit (${maxResponses})`);
          continue;
        }

        const remainingResponses = maxResponses - todayApplications;
        logger.info(`User ${user.id} can send ${remainingResponses} more responses today`);

        // Расшифровываем токен
        const accessToken = decrypt(user.accessToken);
        const hhApi = new HHApiService(accessToken);

        // Получаем фильтры поиска
        const searchFilters: SearchFilters = user.settings.searchFilters ?
          JSON.parse(user.settings.searchFilters) : {};

        // Параметры поиска вакансий
        const searchParams: HHVacancySearchParams = {
          text: searchFilters.text,
          area: searchFilters.area,
          salary: searchFilters.salary,
          experience: searchFilters.experience,
          schedule: searchFilters.schedule,
          per_page: Math.min(remainingResponses * 2, 50), // Берем с запасом
          page: 0,
        };

        // Ищем вакансии
        const vacanciesResult = await hhApi.searchVacancies(searchParams);
        logger.info(`Found ${vacanciesResult.items.length} vacancies for user ${user.id}`);

        // Получаем черный список работодателей
        const blacklist: string[] = user.settings.blacklistEmployers ?
          JSON.parse(user.settings.blacklistEmployers) : [];

        // Получаем слова-исключения
        const excludeKeywords: string[] = user.settings.excludeKeywords ?
          JSON.parse(user.settings.excludeKeywords) : [];

        // Фильтруем вакансии
        let filteredVacancies = vacanciesResult.items.filter(vacancy => {
          // Проверяем черный список
          if (blacklist.includes(vacancy.employer.id)) {
            return false;
          }

          // Проверяем слова-исключения
          const titleLower = vacancy.name.toLowerCase();
          for (const keyword of excludeKeywords) {
            if (titleLower.includes(keyword.toLowerCase())) {
              return false;
            }
          }

          return true;
        });

        // Проверяем, на какие вакансии уже откликались
        const vacancyIds = filteredVacancies.map(v => v.id);
        const existingJobs = await prisma.job.findMany({
          where: {
            hhJobId: { in: vacancyIds },
          },
          include: {
            applications: {
              where: { userId: user.id },
            },
          },
        });

        const appliedVacancyIds = existingJobs
          .filter(job => job.applications.length > 0)
          .map(job => job.hhJobId);

        filteredVacancies = filteredVacancies.filter(
          v => !appliedVacancyIds.includes(v.id)
        );

        logger.info(`After filtering, ${filteredVacancies.length} new vacancies for user ${user.id}`);

        // Берем только нужное количество вакансий
        const vacanciesToApply = filteredVacancies.slice(0, remainingResponses);

        // Получаем первое резюме пользователя
        const resume = user.resumes[0];
        if (!resume || !resume.hhResumeId) {
          logger.warn(`User ${user.id} has no resume`);
          continue;
        }

        // Отправляем отклики
        for (const vacancy of vacanciesToApply) {
          try {
            // Сохраняем вакансию в БД
            const job = await prisma.job.upsert({
              where: { hhJobId: vacancy.id },
              update: {
                title: vacancy.name,
                company: vacancy.employer.name,
                url: vacancy.alternate_url,
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
                publishedAt: new Date(vacancy.published_at),
              },
            });

            // Генерируем сопроводительное письмо
            const coverLetter = user.settings.coverLetterTemplate ?
              generateCoverLetter(user.settings.coverLetterTemplate, vacancy) :
              '';

            // Отправляем отклик
            await hhApi.applyToVacancy(
              vacancy.id,
              resume.hhResumeId,
              coverLetter
            );

            // Сохраняем в БД
            await prisma.jobApplication.create({
              data: {
                userId: user.id,
                jobId: job.id,
                resumeId: resume.id,
                letterContent: coverLetter,
                status: 'sent',
              },
            });

            // Обновляем аналитику
            await prisma.analytics.upsert({
              where: {
                userId_date: {
                  userId: user.id,
                  date: today,
                },
              },
              update: {
                responsesCount: { increment: 1 },
              },
              create: {
                userId: user.id,
                date: today,
                responsesCount: 1,
                viewsCount: 0,
                invitationsCount: 0,
                rejectionsCount: 0,
              },
            });

            logger.info(`Successfully applied to vacancy ${vacancy.id} for user ${user.id}`);

            // Случайная задержка (5-15 секунд)
            await sleep(randomDelay(5000, 15000));

          } catch (error: any) {
            logger.error(`Failed to apply to vacancy ${vacancy.id}:`, error.message);
            // Продолжаем со следующей вакансией
          }
        }

        logger.info(`Sent ${vacanciesToApply.length} applications for user ${user.id}`);

      } catch (error: any) {
        logger.error(`Error processing user ${user.id}:`, error);
      }
    }

    logger.info('Auto-responder job completed');

  } catch (error) {
    logger.error('Auto-responder job error:', error);
  }
};

// Запускаем каждый час
cron.schedule('0 * * * *', () => {
  logger.info('Auto-responder cron job triggered');
  runAutoResponder();
});

// Для тестирования: запускаем каждые 5 минут в режиме разработки
if (process.env.NODE_ENV === 'development') {
  cron.schedule('*/5 * * * *', () => {
    logger.info('Auto-responder cron job triggered (dev mode)');
    runAutoResponder();
  });
}

logger.info('Auto-responder job scheduler initialized');
