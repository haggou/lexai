import { createClient } from 'redis';


let redisClient;

const initRedis = async () => {
    // If we already have a client, return it
    if (redisClient && redisClient.isOpen) return redisClient;

    const username = process.env.REDIS_USERNAME || 'default';
    const password = process.env.REDIS_PASSWORD || process.env.REDIS_API_KEY || '';
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || 6379;

    // Prefer REDIS_URL if available
    const url = process.env.REDIS_URL || `redis://${username}:${password}@${host}:${port}`;

    // Clean up URL if no auth provided (redis://:@localhost...)
    const cleanUrl = url.replace('redis://:0@', 'redis://').replace('redis://:@', 'redis://');

    console.log(`[Redis] Connecting to ${host}:${port}...`);

    redisClient = createClient({
        url: cleanUrl
    });

    redisClient.on('error', (err) => {
        // Suppress infinite reconnection logs
        // console.warn('[Redis] Connection Error:', err.message);
        if (redisClient) {
            redisClient.disconnect().catch(() => { });
            redisClient = null;
        }
    });

    redisClient.on('connect', () => {
        console.log('[Redis] Connected successfully.');
    });

    try {
        await redisClient.connect();
    } catch (err) {
        console.warn("[Redis] Failed to connect initially. Caching will be disabled.");
        console.warn(`[Redis] Connection string used (redacted): ${cleanUrl.replace(/:[^:@]*@/, ':****@')}`);
        redisClient = null; // Ensure we don't return a disconnected client easily
    }

    return redisClient;
};

export const getRedisClient = async () => {
    if (!redisClient) {
        await initRedis();
    }
    return redisClient;
};

// Utility to cache get/set
export const setCache = async (key, value, ttl = 3600) => {
    const client = await getRedisClient();
    if (!client || !client.isOpen) return;
    try {
        await client.set(key, JSON.stringify(value), { EX: ttl });
    } catch (e) {
        console.error("Cache Set Error:", e);
    }
};

export const getCache = async (key) => {
    const client = await getRedisClient();
    if (!client || !client.isOpen) return null;
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Cache Get Error:", e);
        return null;
    }
};
