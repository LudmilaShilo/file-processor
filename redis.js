const Redis = require("ioredis");
require("./config");

// Ініціалізація Redis-клієнта
const client = new Redis({
  host: process.env.REDIS_MAIN_HOST || "localhost",
  port: process.env.REDIS_MAIN_PORT || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const clientQueue = new Redis({
  host: process.env.REDIS_MAIN_HOST || "localhost",
  port: process.env.REDIS_MAIN_PORT || 6380,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

console.log("Redis start");

// Обробка помилок підключення
client.on("error", (err) => {
  if (err.code === "ECONNREFUSED") {
    console.error("Redis is not available");
    process.exit(1);
  }
  console.error("Redis error", err);
});

// Експорт функцій для роботи з Redis
const get = async (key) => {
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null; // Додаємо перевірку на null
  } catch (err) {
    console.warn("Error getting value from Redis:", err);
    return null; // Повертаємо null у випадку помилки
  }
};

const put = async (key, value) => {
  try {
    await client.set(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Error setting value in Redis:", err);
  }
};

// Експортуємо client та функції
module.exports = {
  client,
  clientQueue, // Експортуємо клієнта
  get, // Експортуємо функцію get
  put, // Експортуємо функцію put
};
