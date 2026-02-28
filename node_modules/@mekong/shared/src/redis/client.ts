import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

let redisInstance: Redis | null = null;

export const getRedisClient = (): Redis => {
    if (!redisInstance) {
        redisInstance = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        redisInstance.on('error', (err) => {
            logger.error('Redis Client Error', err);
        });

        redisInstance.on('connect', () => {
            logger.info('Redis Client Connected');
        });
    }
    return redisInstance;
};
