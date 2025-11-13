import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

const router = Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// GET /api/settings - Получить настройки пользователя
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const settings = await prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Создаем настройки по умолчанию
      const newSettings = await prisma.settings.create({
        data: {
          userId,
          enabled: false,
          maxResponsesPerDay: 200,
          useAiGeneration: false,
          scheduleEnabled: false,
        },
      });
      return res.json(newSettings);
    }

    // Парсим JSON поля
    const response = {
      ...settings,
      searchFilters: settings.searchFilters ? JSON.parse(settings.searchFilters) : null,
      excludeKeywords: settings.excludeKeywords ? JSON.parse(settings.excludeKeywords) : null,
      blacklistEmployers: settings.blacklistEmployers ? JSON.parse(settings.blacklistEmployers) : null,
      scheduleTime: settings.scheduleTime ? JSON.parse(settings.scheduleTime) : null,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// PUT /api/settings - Обновить настройки
router.put('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const {
      enabled,
      maxResponsesPerDay,
      searchFilters,
      excludeKeywords,
      blacklistEmployers,
      coverLetterTemplate,
      useAiGeneration,
      scheduleEnabled,
      scheduleTime,
    } = req.body;

    const settings = await prisma.settings.upsert({
      where: { userId },
      update: {
        enabled: enabled !== undefined ? enabled : undefined,
        maxResponsesPerDay: maxResponsesPerDay !== undefined ? maxResponsesPerDay : undefined,
        searchFilters: searchFilters ? JSON.stringify(searchFilters) : undefined,
        excludeKeywords: excludeKeywords ? JSON.stringify(excludeKeywords) : undefined,
        blacklistEmployers: blacklistEmployers ? JSON.stringify(blacklistEmployers) : undefined,
        coverLetterTemplate: coverLetterTemplate !== undefined ? coverLetterTemplate : undefined,
        useAiGeneration: useAiGeneration !== undefined ? useAiGeneration : undefined,
        scheduleEnabled: scheduleEnabled !== undefined ? scheduleEnabled : undefined,
        scheduleTime: scheduleTime ? JSON.stringify(scheduleTime) : undefined,
      },
      create: {
        userId,
        enabled: enabled || false,
        maxResponsesPerDay: maxResponsesPerDay || 200,
        searchFilters: searchFilters ? JSON.stringify(searchFilters) : null,
        excludeKeywords: excludeKeywords ? JSON.stringify(excludeKeywords) : null,
        blacklistEmployers: blacklistEmployers ? JSON.stringify(blacklistEmployers) : null,
        coverLetterTemplate,
        useAiGeneration: useAiGeneration || false,
        scheduleEnabled: scheduleEnabled || false,
        scheduleTime: scheduleTime ? JSON.stringify(scheduleTime) : null,
      },
    });

    // Парсим JSON поля для ответа
    const response = {
      ...settings,
      searchFilters: settings.searchFilters ? JSON.parse(settings.searchFilters) : null,
      excludeKeywords: settings.excludeKeywords ? JSON.parse(settings.excludeKeywords) : null,
      blacklistEmployers: settings.blacklistEmployers ? JSON.parse(settings.blacklistEmployers) : null,
      scheduleTime: settings.scheduleTime ? JSON.parse(settings.scheduleTime) : null,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
