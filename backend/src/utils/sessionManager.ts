import { prisma } from './db';
import { logger } from './logger';
import { Request } from 'express';

export async function createSession(
  userId: string,
  token: string,
  req: Request
): Promise<void> {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Expire old sessions (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.session.create({
      data: {
        userId,
        token,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    logger.info(`Session created for user ${userId}`);
  } catch (error) {
    logger.error('Failed to create session:', error);
    throw error;
  }
}

export async function updateSessionActivity(token: string): Promise<void> {
  try {
    await prisma.session.update({
      where: { token },
      data: {
        lastActivityAt: new Date(),
      },
    });
  } catch (error) {
    // Ignore errors - don't break requests for activity updates
    logger.debug('Failed to update session activity:', error);
  }
}

export async function getUserSessions(userId: string): Promise<any[]> {
  return await prisma.session.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      lastActivityAt: 'desc',
    },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      deviceInfo: true,
      location: true,
      createdAt: true,
      lastActivityAt: true,
    },
  });
}

export async function terminateSession(sessionId: string, userId: string): Promise<boolean> {
  try {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return false;
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    logger.info(`Session ${sessionId} terminated for user ${userId}`);
    return true;
  } catch (error) {
    logger.error('Failed to terminate session:', error);
    return false;
  }
}

export async function terminateAllSessions(userId: string, exceptToken?: string): Promise<number> {
  try {
    const where: any = { userId };
    if (exceptToken) {
      where.token = { not: exceptToken };
    }

    const result = await prisma.session.deleteMany({ where });

    logger.info(`Terminated ${result.count} sessions for user ${userId}`);
    return result.count;
  } catch (error) {
    logger.error('Failed to terminate all sessions:', error);
    return 0;
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired sessions`);
    }
  } catch (error) {
    logger.error('Failed to cleanup expired sessions:', error);
  }
}
