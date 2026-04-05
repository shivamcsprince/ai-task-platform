require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
    await connectRedis();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

bootstrap();
