const Redis = require('ioredis');
const logger = require('../utils/logger');

let client = null;

async function connectRedis() {
  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
    lazyConnect: true,
  };

  client = new Redis(config);

  client.on('connect', () => logger.info('✅ Redis connected'));
  client.on('error', (err) => logger.error('Redis error:', err.message));
  client.on('reconnecting', () => logger.warn('Redis reconnecting...'));

  await client.connect();
  return client;
}

function getRedisClient() {
  if (!client) throw new Error('Redis not initialized. Call connectRedis() first.');
  return client;
}

module.exports = { connectRedis, getRedisClient };
