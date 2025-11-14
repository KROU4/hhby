import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

const router = Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// GET /api/search/history - Получить историю поиска
router.get('/history', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { limit = 10 } = req.query;

    const history = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: {
        lastUsedAt: 'desc',
      },
      take: Number(limit),
    });

    res.json(history);
  } catch (error: any) {
    logger.error('Get search history error:', error);
    res.status(500).json({ error: 'Failed to get search history' });
  }
});

// POST /api/search/history - Сохранить поисковый запрос
router.post('/history', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { text, area, salary, experience, schedule, name, resultCount } = req.body;

    // Проверяем, есть ли уже такой поиск (по параметрам)
    const existing = await prisma.searchHistory.findFirst({
      where: {
        userId,
        text: text || null,
        area: area || null,
        salary: salary || null,
        experience: experience || null,
        schedule: schedule || null,
      },
    });

    if (existing) {
      // Обновляем существующий
      const updated = await prisma.searchHistory.update({
        where: { id: existing.id },
        data: {
          useCount: { increment: 1 },
          lastUsedAt: new Date(),
          resultCount: resultCount || existing.resultCount,
          name: name || existing.name,
        },
      });
      return res.json(updated);
    }

    // Создаем новый
    const history = await prisma.searchHistory.create({
      data: {
        userId,
        text: text || null,
        area: area || null,
        salary: salary || null,
        experience: experience || null,
        schedule: schedule || null,
        name: name || null,
        resultCount: resultCount || null,
      },
    });

    res.json(history);
  } catch (error: any) {
    logger.error('Save search history error:', error);
    res.status(500).json({ error: 'Failed to save search history' });
  }
});

// PUT /api/search/history/:id - Обновить название поиска
router.put('/history/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name } = req.body;

    const history = await prisma.searchHistory.findFirst({
      where: { id, userId },
    });

    if (!history) {
      return res.status(404).json({ error: 'Search history not found' });
    }

    const updated = await prisma.searchHistory.update({
      where: { id },
      data: { name },
    });

    res.json(updated);
  } catch (error: any) {
    logger.error('Update search history error:', error);
    res.status(500).json({ error: 'Failed to update search history' });
  }
});

// DELETE /api/search/history/:id - Удалить из истории
router.delete('/history/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const history = await prisma.searchHistory.findFirst({
      where: { id, userId },
    });

    if (!history) {
      return res.status(404).json({ error: 'Search history not found' });
    }

    await prisma.searchHistory.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Delete search history error:', error);
    res.status(500).json({ error: 'Failed to delete search history' });
  }
});

// GET /api/search/drafts - Получить черновики откликов
router.get('/drafts', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const drafts = await prisma.applicationDraft.findMany({
      where: { userId },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json(drafts);
  } catch (error: any) {
    logger.error('Get drafts error:', error);
    res.status(500).json({ error: 'Failed to get drafts' });
  }
});

// POST /api/search/drafts - Сохранить черновик отклика
router.post('/drafts', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { vacancyId, vacancyTitle, vacancyCompany, vacancyUrl, resumeId, message } = req.body;

    // Проверяем, есть ли уже черновик для этой вакансии
    const existing = await prisma.applicationDraft.findFirst({
      where: {
        userId,
        vacancyId,
      },
    });

    if (existing) {
      // Обновляем существующий
      const updated = await prisma.applicationDraft.update({
        where: { id: existing.id },
        data: {
          resumeId: resumeId || existing.resumeId,
          message: message || existing.message,
          updatedAt: new Date(),
        },
      });
      return res.json(updated);
    }

    // Создаем новый
    const draft = await prisma.applicationDraft.create({
      data: {
        userId,
        vacancyId,
        vacancyTitle,
        vacancyCompany,
        vacancyUrl,
        resumeId: resumeId || null,
        message: message || null,
      },
    });

    res.json(draft);
  } catch (error: any) {
    logger.error('Save draft error:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

// DELETE /api/search/drafts/:id - Удалить черновик
router.delete('/drafts/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const draft = await prisma.applicationDraft.findFirst({
      where: { id, userId },
    });

    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    await prisma.applicationDraft.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Delete draft error:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

export default router;
