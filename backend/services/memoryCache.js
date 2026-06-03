const NodeCache = require('node-cache');

const DEFAULT_TTL = Number(process.env.NODE_CACHE_TTL_SECONDS || 60);
const CHECK_PERIOD = Number(process.env.NODE_CACHE_CHECK_PERIOD_SECONDS || Math.max(30, Math.floor(DEFAULT_TTL / 2)));

const memoryCache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: CHECK_PERIOD,
  useClones: false,
  deleteOnExpire: true,
  maxKeys: Number(process.env.NODE_CACHE_MAX_KEYS || 5000)
});

function memoryGet(key) {
  return memoryCache.get(key);
}

function memorySet(key, value, ttlSeconds = DEFAULT_TTL) {
  memoryCache.set(key, value, ttlSeconds);
  return value;
}

function memoryDelete(key) {
  memoryCache.del(key);
}

function memoryDeleteByPrefix(prefix) {
  const normalizedPrefix = String(prefix || '').trim();
  if (!normalizedPrefix) return;

  const keys = memoryCache.keys().filter((key) => key.startsWith(normalizedPrefix));
  if (keys.length) {
    memoryCache.del(keys);
  }
}

module.exports = {
  memoryCache,
  memoryGet,
  memorySet,
  memoryDelete,
  memoryDeleteByPrefix
};