import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';

// Схемы валидации

export const searchVacanciesSchema = z.object({
  text: z.string().min(1, 'Поисковый запрос не может быть пустым').optional(),
  area: z.string().optional(),
  salary: z.coerce.number().positive('Зарплата должна быть положительным числом').optional(),
  experience: z.string().optional(),
  schedule: z.string().optional(),
  per_page: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(0).default(0),
});

export const createApplicationSchema = z.object({
  vacancyId: z.string().min(1, 'ID вакансии обязателен'),
  resumeId: z.string().uuid('Некорректный ID резюме'),
  message: z.string().max(5000, 'Сообщение не должно превышать 5000 символов').optional(),
});

export const updateSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  maxResponsesPerDay: z.number().min(1).max(500).optional(),
  coverLetterTemplate: z.string().max(5000).optional(),
  searchFilters: z.object({
    text: z.string().optional(),
    area: z.string().optional(),
    salary: z.number().positive().optional(),
  }).optional(),
  excludeKeywords: z.array(z.string()).optional(),
  blacklistEmployers: z.array(z.string()).optional(),
  useAiGeneration: z.boolean().optional(),
  scheduleEnabled: z.boolean().optional(),
  scheduleTime: z.string().optional(),
});

// Middleware для валидации запросов

export function validateQuery(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Query validation error:', error.errors);
        return res.status(400).json({
          error: 'Неверные параметры запроса',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateBody(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Body validation error:', error.errors);
        return res.status(400).json({
          error: 'Неверные данные запроса',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}
