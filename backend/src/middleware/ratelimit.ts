import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for auth check endpoint
 * 60 requests per minute per IP
 */
export const authCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per window
  message: { error: 'Too many authentication requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiter for API endpoints
 * 100 requests per minute per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
