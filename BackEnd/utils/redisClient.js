import { createClient } from "redis";

let redisClient;

const getRedisClient = async () => {
    if (!redisClient) {
        redisClient = createClient({ url: process.env.REDIS_URL });
        redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
        await redisClient.connect();

    }
    return redisClient;
};

export default getRedisClient;