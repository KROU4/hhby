import { prisma } from './db';
import { logger } from './logger';

export const SubscriptionTiers = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ULTIMATE: 'ultimate',
} as const;

export const TierLimits = {
  [SubscriptionTiers.FREE]: {
    dailyResponses: 20,
    features: {
      basicSearch: true,
      history: true,
      favorites: true,
      analytics: true,
      aiGeneration: false,
      telegram: false,
      priority: false,
    },
  },
  [SubscriptionTiers.BASIC]: {
    dailyResponses: 200,
    features: {
      basicSearch: true,
      history: true,
      favorites: true,
      analytics: true,
      aiGeneration: false,
      telegram: true,
      priority: false,
    },
  },
  [SubscriptionTiers.PRO]: {
    dailyResponses: 500,
    features: {
      basicSearch: true,
      history: true,
      favorites: true,
      analytics: true,
      aiGeneration: true,
      telegram: true,
      priority: false,
    },
  },
  [SubscriptionTiers.ULTIMATE]: {
    dailyResponses: -1, // unlimited
    features: {
      basicSearch: true,
      history: true,
      favorites: true,
      analytics: true,
      aiGeneration: true,
      telegram: true,
      priority: true,
    },
  },
} as const;

export const TierPricing = {
  [SubscriptionTiers.FREE]: { monthly: 0, annually: 0 },
  [SubscriptionTiers.BASIC]: { monthly: 490, annually: 4900 },
  [SubscriptionTiers.PRO]: { monthly: 990, annually: 9900 },
  [SubscriptionTiers.ULTIMATE]: { monthly: 1990, annually: 19900 },
} as const;

export async function checkDailyLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      dailyResponsesLimit: true,
      responsesToday: true,
      lastResetDate: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if we need to reset daily counter
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastReset = new Date(user.lastResetDate);
  lastReset.setHours(0, 0, 0, 0);

  let responsesToday = user.responsesToday;
  if (lastReset < today) {
    // Reset counter
    responsesToday = 0;
    await prisma.user.update({
      where: { id: userId },
      data: {
        responsesToday: 0,
        lastResetDate: new Date(),
      },
    });
  }

  const limit = user.dailyResponsesLimit;
  const remaining = limit === -1 ? -1 : Math.max(0, limit - responsesToday);
  const allowed = limit === -1 || responsesToday < limit;

  // Calculate reset time (midnight)
  const resetAt = new Date();
  resetAt.setDate(resetAt.getDate() + 1);
  resetAt.setHours(0, 0, 0, 0);

  return {
    allowed,
    remaining,
    limit,
    resetAt,
  };
}

export async function incrementDailyCounter(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      responsesToday: { increment: 1 },
    },
  });
}

export async function getUserSubscription(userId: string): Promise<{
  tier: string;
  limits: typeof TierLimits[keyof typeof TierLimits];
  pricing: typeof TierPricing[keyof typeof TierPricing];
  expiresAt: Date | null;
  isActive: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const tier = user.subscriptionTier as keyof typeof TierLimits;
  const limits = TierLimits[tier] || TierLimits.free;
  const pricing = TierPricing[tier] || TierPricing.free;

  const isActive =
    tier === 'free' ||
    !user.subscriptionExpiresAt ||
    user.subscriptionExpiresAt > new Date();

  return {
    tier,
    limits,
    pricing,
    expiresAt: user.subscriptionExpiresAt,
    isActive,
  };
}

export async function updateSubscriptionTier(
  userId: string,
  tier: keyof typeof SubscriptionTiers,
  expiresAt?: Date
): Promise<void> {
  const limits = TierLimits[tier];

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier,
      subscriptionExpiresAt: expiresAt || null,
      dailyResponsesLimit: limits.dailyResponses,
    },
  });

  logger.info(`User ${userId} subscription updated to ${tier}`);
}

export function hasFeature(
  tier: string,
  feature: keyof typeof TierLimits.FREE.features
): boolean {
  const limits = TierLimits[tier as keyof typeof TierLimits] || TierLimits.free;
  return limits.features[feature] || false;
}
