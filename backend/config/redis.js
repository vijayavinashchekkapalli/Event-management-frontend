const { createClient } = require('redis');
const { memoryGet, memorySet, memoryDelete, memoryDeleteByPrefix } = require('../services/memoryCache');

let client;
let connectPromise;

function normalizeKey(key) {
  return String(key || '').trim();
}

function isRedisReady() {
  return Boolean(client && client.isOpen);
}

async function connectRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  if (isRedisReady()) return client;
  if (connectPromise) return connectPromise;

  client = createClient({ url: redisUrl });
  client.on('error', (error) => {
    console.error('Redis error:', error.message);
  });

  connectPromise = client.connect()
    .then(() => {
      connectPromise = null;
      return client;
    })
    .catch((error) => {
      connectPromise = null;
      client = null;
      throw error;
    });

  return connectPromise;
}

function getRedisClient() {
  return isRedisReady() ? client : null;
}

async function cacheGet(key) {
  const normalizedKey = normalizeKey(key);
  if (!normalizedKey) return null;

  const memoryValue = memoryGet(normalizedKey);
  if (typeof memoryValue !== 'undefined') {
    return memoryValue;
  }

  const redis = getRedisClient();
  if (!redis) return null;

  const cached = await redis.get(normalizedKey);
  if (!cached) return null;

  try {
    const parsed = JSON.parse(cached);
    memorySet(normalizedKey, parsed, Number(process.env.NODE_CACHE_TTL_SECONDS || 60));
    return parsed;
  } catch (error) {
    return cached;
  }
}

async function cacheSet(key, value, ttlSeconds = Number(process.env.CACHE_TTL_SECONDS || 60)) {
  const normalizedKey = normalizeKey(key);
  if (!normalizedKey) return false;

  memorySet(normalizedKey, value, ttlSeconds);

  const redis = getRedisClient();
  if (!redis) return true;

  await redis.set(normalizedKey, JSON.stringify(value), { EX: Math.max(1, Number(ttlSeconds) || 60) });
  return true;
}

async function cacheDelete(key) {
  const normalizedKey = normalizeKey(key);
  if (!normalizedKey) return false;

  memoryDelete(normalizedKey);

  const redis = getRedisClient();
  if (redis) {
    await redis.del(normalizedKey);
  }

  return true;
}

async function cacheDeleteByPrefix(prefix) {
  const normalizedPrefix = normalizeKey(prefix);
  if (!normalizedPrefix) return false;

  memoryDeleteByPrefix(normalizedPrefix);

  const redis = getRedisClient();
  if (!redis) return true;

  const keys = [];
  for await (const key of redis.scanIterator({ MATCH: `${normalizedPrefix}*`, COUNT: 100 })) {
    keys.push(key);
  }

  if (keys.length) {
    await redis.del(keys);
  }

  return true;
}

async function invalidateCachePrefixes(prefixes = []) {
  await Promise.all(prefixes.map((prefix) => cacheDeleteByPrefix(prefix)));
}

async function invalidateDashboardCache() {
  await invalidateCachePrefixes([
    'admin:dashboard:',
    'admin:registrations:',
    'admin:issues:',
    'admin:registration-link:',
    'admin:banners:',
    'team:mine:',
    'issue:mine:',
    'banner:',
    'payment:',
    'feeSettings:',
    'user:me:'
  ]);
}

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisReady,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeleteByPrefix,
  invalidateCachePrefixes,
  invalidateDashboardCache
};
