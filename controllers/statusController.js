const catchAsync = require("../unit/catchAsync.js");
const Redis = require("../redis.js");

const clients = {};

const SSEconnector = catchAsync(async (req, res, next) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const userId = req.user.toObject()._id;
  clients[userId] = res;

  console.log(`User ${userId} connects`);

  req.on("close", () => {
    console.log(`User ${userId} disconnected`);
    delete clients[userId];
  });
});

const getProcessingData = async (userId) => {
  let cursor = "0";
  const allData = [];

  do {
    const result = await Redis.client.scan(
      cursor,
      "MATCH",
      `processing:${userId}:*:*`
    );
    cursor = result[0]; // Оновлюємо курсор
    const keys = result[1]; // Отримуємо знайдені ключі

    // Отримуємо значення для кожного ключа
    if (keys.length > 0) {
      const values = await Redis.client.mget(keys);
      values.forEach((value, index) => {
        if (value) {
          console.log("value", `${value}`);
          allData.push({
            fileName: keys[index].split(":")[2],
            task: keys[index].split(":")[3],
            status: value.split('"')[1],
          });
        }
      });
    }
  } while (cursor !== "0"); // Продовжуємо, поки курсор не повернеться до нуля

  return allData; // Повертаємо всі зібрані дані
};

const getStatus = catchAsync(async (req, res, next) => {
  const userId = req.user.toObject()._id;
  const data = await getProcessingData(userId);
  res.status(200).json({
    status: "success",
    data,
  });
});

module.exports = { SSEconnector, clients, getStatus, getProcessingData };
