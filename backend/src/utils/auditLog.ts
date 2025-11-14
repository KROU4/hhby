import { prisma } from './db';
import { logger } from './logger';

export interface AuditLogData {
  userId: string;
  action: string;
  resource?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource || null,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        success: data.success !== undefined ? data.success : true,
        errorMessage: data.errorMessage || null,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw - audit log failures shouldn't break the app
  }
}

export async function getUserAuditLogs(
  userId: string,
  options?: {
    action?: string;
    limit?: number;
    offset?: number;
  }
): Promise<any[]> {
  const where: any = { userId };
  if (options?.action) {
    where.action = options.action;
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

// Common audit actions
export const AuditActions = {
  // Auth
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  TOKEN_REFRESH: 'auth.token_refresh',

  // Applications
  APPLICATION_SENT: 'application.sent',
  APPLICATION_VIEWED: 'application.viewed',

  // Settings
  SETTINGS_UPDATED: 'settings.updated',

  // Security
  SESSION_CREATED: 'session.created',
  SESSION_TERMINATED: 'session.terminated',
  PASSWORD_CHANGED: 'security.password_changed',

  // Subscriptions
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPGRADED: 'subscription.upgraded',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',

  // Export
  DATA_EXPORTED: 'data.exported',
} as const;
