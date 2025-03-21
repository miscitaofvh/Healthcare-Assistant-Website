import { createClient } from 'redis';

const createRedisClient = async () => {
    const client = createClient({
        url: process.env.REDIS_URL     
    });

    client.on('error', (err) => console.error('❌ Redis Error:', err));

    await client.connect();
    console.log("✅ Redis connected");
    return client;
};

export default createRedisClient;
