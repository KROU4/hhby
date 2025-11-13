import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { HHApiService } from '../services/hhApi';
import { prisma } from '../utils/db';
import { decrypt } from '../utils/encryption';
import { logger } from '../utils/logger';

const router = Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// GET /api/resumes - Получить резюме пользователя
router.get('/', async (req: AuthRequest, res) => {
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

    // Получаем резюме из HH.ru
    const hhApi = new HHApiService(accessToken);
    const hhResumes = await hhApi.getMyResumes();

    // Сохраняем в БД
    for (const hhResume of hhResumes) {
      await prisma.resume.upsert({
        where: { hhResumeId: hhResume.id },
        update: {
          title: hhResume.title,
          fileUrl: hhResume.url,
        },
        create: {
          userId,
          hhResumeId: hhResume.id,
          title: hhResume.title,
          fileUrl: hhResume.url,
        },
      });
    }

    // Возвращаем резюме из БД
    const resumes = await prisma.resume.findMany({
      where: { userId },
    });

    res.json(resumes);
  } catch (error: any) {
    logger.error('Get resumes error:', error);
    res.status(500).json({ error: 'Failed to get resumes' });
  }
});

// GET /api/resumes/:id - Получить конкретное резюме
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const resumeId = req.params.id;

    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
      },
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json(resume);
  } catch (error: any) {
    logger.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to get resume' });
  }
});

export default router;
