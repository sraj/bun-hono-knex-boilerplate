// TODO: Replace with actual Redis client (e.g., ioredis, redis)
// import Redis from 'ioredis';
// import { config } from '../shared/config';
// export const redis = new Redis({ host: config.REDIS_HOST, port: config.REDIS_PORT });

export const redis = {
  get: async (_key: string): Promise<string | null> => {
    console.warn('Redis not configured — using dummy client');
    return null;
  },
  set: async (
    _key: string,
    _value: string,
    _ttlSeconds?: number,
  ): Promise<'OK'> => {
    console.warn('Redis not configured — using dummy client');
    return 'OK';
  },
  del: async (_key: string): Promise<number> => {
    console.warn('Redis not configured — using dummy client');
    return 0;
  },
};
