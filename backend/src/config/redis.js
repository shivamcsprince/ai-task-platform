const Redis = require('ioredis');
const logger = require('../utils/logger');

let client = null;

async function connectRedis() {
  const redisUrl = process.env.REDIS_URL;

  client = redisUrl
    ? new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        tls: redisUrl.startsWith('rediss') ? {} : undefined,
      })
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      });

  client.on('connect', () => logger.info('✅ Redis connected'));
  client.on('error', (err) => logger.error('Redis error:', err.message));

  await client.connect();
  return client;
}

function getRedisClient() {
  if (!client) throw new Error('Redis not initialized');
  return client;
}

module.exports = { connectRedis, getRedisClient };