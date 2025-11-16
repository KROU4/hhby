import express from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { generateCoverLetter, validateOpenAiApiKey, estimateCost } from '../utils/aiGenerator';
import { hasFeature } from '../utils/subscriptionManager';
import { createAuditLog, AuditActions } from '../utils/auditLog';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schema
const generateCoverLetterSchema = z.object({
  vacancyId: z.string().optional(),
  vacancy: z.object({
    title: z.string(),
    company: z.string(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    salary: z.string().optional(),
    experience: z.string().optional(),
    schedule: z.string().optional(),
  }),
  options: z.object({
    style: z.enum(['professional', 'friendly', 'creative', 'concise']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    customPrompt: z.string().optional(),
    includeSkills: z.boolean().optional(),
  }).optional(),
});

const validateApiKeySchema = z.object({
  apiKey: z.string().min(20),
});

/**
 * POST /api/ai/generate-cover-letter
 * Generate AI cover letter for a vacancy
 */
router.post(
  '/generate-cover-letter',
  authenticateToken,
  validateBody(generateCoverLetterSchema),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { vacancy, options } = req.body;

      // Check if user has AI generation feature
      const canUseAi = await hasFeature(userId, 'aiGeneration');

      if (!canUseAi) {
        return res.status(403).json({
          error: 'Feature not available',
          message: 'AI генерация доступна только на тарифах Pro и Ultimate',
          upgradeRequired: true,
        });
      }

      // Get user profile and settings
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          settings: {
            select: {
              openaiApiKey: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user profile from HH.ru (we can extend this later)
      const userProfile = {
        firstName: user.email?.split('@')[0], // Placeholder
        // Can add more fields from resume if available
      };

      // Generate cover letter
      logger.info(`Generating cover letter for user ${userId}`, {
        vacancy: vacancy.title,
        company: vacancy.company,
      });

      const result = await generateCoverLetter(
        vacancy,
        userProfile,
        options || {},
        user.settings?.openaiApiKey || undefined
      );

      // Create audit log
      await createAuditLog({
        userId,
        action: 'ai.cover_letter_generated',
        resource: vacancy.title,
        details: {
          company: vacancy.company,
          tokensUsed: result.tokensUsed,
          cost: estimateCost(result.tokensUsed),
          style: options?.style || 'professional',
          length: options?.length || 'medium',
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        coverLetter: result.text,
        meta: {
          tokensUsed: result.tokensUsed,
          estimatedCost: estimateCost(result.tokensUsed),
          style: options?.style || 'professional',
          length: options?.length || 'medium',
        },
      });
    } catch (error: any) {
      logger.error('AI generation error:', error);

      // Create audit log for failure
      await createAuditLog({
        userId: req.userId!,
        action: 'ai.cover_letter_failed',
        resource: req.body.vacancy?.title,
        details: {
          error: error.message,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: false,
        errorMessage: error.message,
      });

      res.status(500).json({
        error: 'AI generation failed',
        message: error.message || 'Не удалось сгенерировать письмо. Попробуйте еще раз.',
      });
    }
  }
);

/**
 * POST /api/ai/validate-api-key
 * Validate OpenAI API key format and connectivity
 */
router.post(
  '/validate-api-key',
  authenticateToken,
  validateBody(validateApiKeySchema),
  async (req: AuthRequest, res) => {
    try {
      const { apiKey } = req.body;

      // Validate format
      if (!validateOpenAiApiKey(apiKey)) {
        return res.status(400).json({
          valid: false,
          error: 'Неверный формат API ключа. Ключ OpenAI должен начинаться с "sk-"',
        });
      }

      // Test API key with a simple request
      try {
        await generateCoverLetter(
          {
            title: 'Test vacancy',
            company: 'Test company',
            description: 'This is a test',
          },
          { firstName: 'Test' },
          { style: 'concise', length: 'short' },
          apiKey
        );

        res.json({
          valid: true,
          message: 'API ключ действителен и работает',
        });
      } catch (error: any) {
        res.status(400).json({
          valid: false,
          error: error.message || 'API ключ недействителен или не работает',
        });
      }
    } catch (error: any) {
      logger.error('API key validation error:', error);
      res.status(500).json({
        valid: false,
        error: 'Ошибка проверки API ключа',
      });
    }
  }
);

/**
 * GET /api/ai/usage-stats
 * Get AI usage statistics for current user
 */
router.get('/usage-stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Get audit logs for AI generation
    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
        action: 'ai.cover_letter_generated',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Calculate statistics
    const totalGenerations = logs.length;
    const totalTokens = logs.reduce((sum, log) => {
      const details = log.details ? JSON.parse(log.details) : {};
      return sum + (details.tokensUsed || 0);
    }, 0);
    const totalCost = estimateCost(totalTokens);

    // Get statistics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLogs = logs.filter(
      (log) => new Date(log.createdAt) >= thirtyDaysAgo
    );

    const last30DaysGenerations = recentLogs.length;
    const last30DaysTokens = recentLogs.reduce((sum, log) => {
      const details = log.details ? JSON.parse(log.details) : {};
      return sum + (details.tokensUsed || 0);
    }, 0);

    res.json({
      success: true,
      stats: {
        allTime: {
          generations: totalGenerations,
          tokensUsed: totalTokens,
          estimatedCost: totalCost,
        },
        last30Days: {
          generations: last30DaysGenerations,
          tokensUsed: last30DaysTokens,
          estimatedCost: estimateCost(last30DaysTokens),
        },
        averageTokensPerGeneration:
          totalGenerations > 0 ? Math.round(totalTokens / totalGenerations) : 0,
      },
    });
  } catch (error: any) {
    logger.error('Usage stats error:', error);
    res.status(500).json({
      error: 'Failed to get usage statistics',
    });
  }
});

export default router;
