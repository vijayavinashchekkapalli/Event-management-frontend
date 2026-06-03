const crypto = require('crypto');
const { cacheGet, cacheSet } = require('../config/redis');

function stableStringify(value) {
  if (!value || typeof value !== 'object') return String(value ?? '');
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  return `{${Object.keys(value).sort().map((key) => `${key}:${stableStringify(value[key])}`).join(',')}}`;
}

function buildCacheKey(req, prefix, varyByUser) {
  const baseUrl = String(req.originalUrl || req.url || '').split('?')[0];
  const queryKey = stableStringify(req.query || {});
  const userKey = varyByUser
    ? [req.user?.id, req.user?.uid, req.user?.email, req.user?.phone, req.user?.admin ? 'admin' : 'user']
        .filter(Boolean)
        .join(':')
    : 'public';

  const rawKey = [req.method, baseUrl, queryKey, userKey].join('|');
  const hash = crypto.createHash('sha1').update(rawKey).digest('hex');
  return `${prefix}:${hash}`;
}

function cacheResponse(options = {}) {
  const {
    prefix = 'cache',
    ttl = 60,
    varyByUser = false,
    cacheStatuses = [200],
    cacheControl = null
  } = options;

  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = buildCacheKey(req, prefix, varyByUser);

    try {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        if (cacheControl) {
          res.setHeader('Cache-Control', cacheControl);
        }
        res.setHeader('X-Cache', 'HIT');
        return res.status(cached.statusCode || 200).json(cached.body);
      }
    } catch (error) {
      console.warn('[cacheMiddleware] read failed:', error.message);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const statusCode = res.statusCode || 200;
      if (statusCode < 400 && cacheStatuses.includes(statusCode)) {
        cacheSet(cacheKey, { statusCode, body }, ttl).catch((error) => {
          console.warn('[cacheMiddleware] write failed:', error.message);
        });
      }

      if (cacheControl) {
        res.setHeader('Cache-Control', cacheControl);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

module.exports = { cacheResponse, buildCacheKey };