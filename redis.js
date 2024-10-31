const Redis = require("ioredis");
require("./config");

const client = new Redis({
  host: process.env.REDIS_MAIN_HOST || "localhost",
  port: process.env.REDIS_MAIN_PORT || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const clientQueue = new Redis({
  host: process.env.REDIS_Queue_HOST || "localhost",
  port: process.env.REDIS_Queue_PORT || 6380,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

console.log("Redis start");

client.on("error", (err) => {
  if (err.code === "ECONNREFUSED") {
    console.error("Redis is not available");
    process.exit(1);
  }
  console.error("Redis error", err);
});

const get = async (key) => {
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.warn("Error getting value from Redis:", err);
    return null;
  }
};

const put = async (key, value) => {
  try {
    await client.set(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Error setting value in Redis:", err);
  }
};

const remove = async (key) => {
  try {
    await client.del(key);
    console.log(`Key ${key} deleted from Redis`);
  } catch (err) {
    console.warn("Error deleting value in Redis:", err);
  }
};

module.exports = {
  client,
  clientQueue,
  get,
  put,
  remove,
};
