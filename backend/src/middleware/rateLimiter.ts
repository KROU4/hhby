import rateLimit from 'express-rate-limit';

// General API rate limit - 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Слишком много запросов с этого IP, попробуйте позже',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints - stricter limit to prevent brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Слишком много попыток авторизации, попробуйте через 15 минут',
  standardHeaders: true,
  legacyHeaders: false,
});

// Search endpoints - moderate limit to prevent HH API abuse
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Слишком много поисковых запросов, подождите минуту',
  standardHeaders: true,
  legacyHeaders: false,
});

// Application creation - strict limit to prevent spam
export const applicationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Слишком много откликов в минуту, подождите',
  standardHeaders: true,
  legacyHeaders: false,
});
