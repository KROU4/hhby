import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { checkDailyLimit } from '../utils/subscriptionManager';
import { logger } from '../utils/logger';

export const checkSubscriptionLimits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const limits = await checkDailyLimit(userId);

    if (!limits.allowed) {
      return res.status(429).json({
        error: 'Daily limit reached',
        message: `Вы исчерпали дневной лимит откликов (${limits.limit}). Лимит обновится в ${limits.resetAt.toLocaleTimeString('ru-RU')}`,
        limit: limits.limit,
        remaining: limits.remaining,
        resetAt: limits.resetAt,
        upgradeRequired: true,
      });
    }

    // Add limit info to request for potential use
    req.limits = limits;

    next();
  } catch (error) {
    logger.error('Subscription check error:', error);
    res.status(500).json({ error: 'Failed to check subscription limits' });
  }
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      limits?: {
        allowed: boolean;
        remaining: number;
        limit: number;
        resetAt: Date;
      };
    }
  }
}
