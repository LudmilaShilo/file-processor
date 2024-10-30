const catchAsync = require("../unit/catchAsync.js");

const clients = {};

const SSEconnector = catchAsync(async (req, res, next) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Відправляємо заголовки відразу

  // Зберігаємо підключення клієнта
  const userId = req.user.toObject()._id;
  clients[userId] = res;

  console.log(`User ${userId} connects`);

  // Видаляємо підключення при відключенні клієнта
  req.on("close", () => {
    console.log(`User ${userId} disconnected`);
    delete clients[userId];
  });
});

module.exports = { SSEconnector, clients };
