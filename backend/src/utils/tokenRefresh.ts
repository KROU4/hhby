import { prisma } from './db';
import { encrypt, decrypt } from './encryption';
import { HHApiService } from '../services/hhApi';
import { logger } from './logger';

/**
 * Проверяет и обновляет токен пользователя, если он истек
 * @param userId - ID пользователя
 * @returns true если токен валиден или успешно обновлен, false если обновление не удалось
 */
export async function ensureValidToken(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.accessToken || !user.refreshToken || !user.tokenExpiresAt) {
      logger.error(`User ${userId} has no tokens`);
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(user.tokenExpiresAt);

    // Проверяем, истек ли токен или истечет в ближайшие 5 минут
    const bufferTime = 5 * 60 * 1000; // 5 минут
    const shouldRefresh = expiresAt.getTime() - now.getTime() < bufferTime;

    if (!shouldRefresh) {
      logger.debug(`Token for user ${userId} is still valid`);
      return true;
    }

    logger.info(`Token for user ${userId} is expired or expiring soon, refreshing...`);

    // Расшифровываем refresh token
    const refreshToken = decrypt(user.refreshToken);

    // Обновляем токен через HH API
    const hhApi = new HHApiService();
    const tokenData = await hhApi.refreshAccessToken(refreshToken);

    // Шифруем новые токены
    const encryptedAccessToken = encrypt(tokenData.access_token);
    const encryptedRefreshToken = encrypt(tokenData.refresh_token);
    const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Обновляем токены в БД
    await prisma.user.update({
      where: { id: userId },
      data: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: newExpiresAt,
      },
    });

    logger.info(`Successfully refreshed token for user ${userId}`);
    return true;
  } catch (error: any) {
    logger.error(`Failed to refresh token for user ${userId}:`, error.message);
    return false;
  }
}

/**
 * Получает валидный access token для пользователя
 * Автоматически обновляет токен, если необходимо
 * @param userId - ID пользователя
 * @returns Расшифрованный access token или null если токен не удалось получить
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  try {
    // Обеспечиваем валидность токена
    const isValid = await ensureValidToken(userId);

    if (!isValid) {
      return null;
    }

    // Получаем токен из БД
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accessToken: true },
    });

    if (!user || !user.accessToken) {
      return null;
    }

    // Расшифровываем и возвращаем токен
    return decrypt(user.accessToken);
  } catch (error: any) {
    logger.error(`Failed to get valid access token for user ${userId}:`, error.message);
    return null;
  }
}
