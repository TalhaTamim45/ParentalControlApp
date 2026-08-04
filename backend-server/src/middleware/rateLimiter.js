// In-Memory Rate Limiter Middleware
const limits = new Map();

function createRateLimiter(options) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 5;
  const message = options.message || 'Too many requests. Please try again later.';

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${options.name || 'global'}_${ip}`;
    const now = Date.now();

    let record = limits.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
    } else {
      record.count += 1;
    }

    limits.set(key, record);

    if (record.count > max) {
      return res.status(429).json({ success: false, error: message });
    }

    next();
  };
}

const loginLimiter = createRateLimiter({
  name: 'login',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many parent login attempts. Please wait 15 minutes.'
});

const generateLimiter = createRateLimiter({
  name: 'generate_code',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many pairing code requests. Please wait.'
});

const validateLimiter = createRateLimiter({
  name: 'validate_code',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many pairing code validation attempts. Please wait.'
});

module.exports = {
  loginLimiter,
  generateLimiter,
  validateLimiter
};
