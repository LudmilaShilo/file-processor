const catchAsync = require("../unit/catchAsync.js");
const constants = require("../constants.js");
const AppError = require("../unit/appError.js");
const File = require("../models/fileModel.js");
const Redis = require("../redis.js");
const tasksQueue = require("../queue.js");
const path = require("path");
const fs = require("fs");

const getFileStream = ({ userId, fileName, task }) => {
  const filePath = path.join(
    __dirname,
    `../fileStorage/${userId}/${task}/${fileName}`
  );
  if (!fs.existsSync(filePath)) {
    throw new Error("File not found");
  }
  return fs.createReadStream(filePath);
};

const isProcessingSupported = (task) => {
  return !!constants.tasks[task];
};

exports.create = catchAsync(async (req, res, next) => {
  if (!req.body?.task || !req.body?.fileName) {
    return next(new AppError("Send task and file's name", 400));
  }
  if (!isProcessingSupported(req.body?.task)) {
    return next(new AppError("The task isn't implemented yet", 400));
  }
  const fileName = req.body.fileName;
  const userId = req.user.toObject()._id;
  const task = req.body.task;
  const result = await File.findOne({
    name: fileName,
    user: userId,
  }).lean();
  if (!result)
    return next(new AppError("File didn't upload. Upload file at first.", 400));
  const status = await Redis.get(`processing:${userId}:${fileName}:${task}`);
  if (status === constants.tasks.completed) {
    // Якщо файл вже оброблений, завантажуємо його
    const fileStream = getFileStream({ userId, fileName, result });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileWithResult}"`
    );
    res.setHeader("Content-Type", "application/octet-stream");
    fileStream.pipe(res);
    return; // Завершуємо виконання функції
  }
  // якщо задача вже в обробці - нічого не робимо
  if (status && status !== constants.status.failed) {
    return res.status(200).json({
      status: "success",
    });
  }

  // додаємо в обробку
  Redis.put(
    `processing:${userId}:${fileName}:${task}`,
    constants.status.pending
  );

  await tasksQueue.add({ task, fileName, userId });
  const jobCounts = await tasksQueue.getJobCounts();
  console.log("Job Counts:", jobCounts);
  res.status(200).json({
    status: "success",
  });
});

exports.returnResult = catchAsync(async (req, res, next) => {
  if (!req.query?.task || !req.query?.fileName) {
    return next(new AppError("Send task and file's name", 400));
  }
  const userId = req.user.toObject()._id;
  const fileName = req.query.fileName;
  const task = req.query.task;
  const value = await Redis.get(`processing:${userId}:${fileName}:${task}`);
  if (!value) {
    return next(
      new AppError("The task wasn't created. Create task at the first", 400)
    );
  }
  if (value !== constants.status.completed) {
    return next(
      new AppError(`The task isn't ready. It's status is ${value}`, 400)
    );
  }
  const fileStream = getFileStream({ userId, fileName, task });
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  fileStream.pipe(res);
  return;
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
    for (const key of keys) {
      const value = await Redis.get(key);
      if (value) {
        allData.push({
          fileName: key.split(":")[2],
          task: key.split(":")[3],
          status: value,
        }); // Додаємо ключ і значення в масив
      }
    }
  } while (cursor !== "0"); // Продовжуємо, поки курсор не повернеться до нуля

  return allData; // Повертаємо всі зібрані дані
};

exports.getStatus = catchAsync(async (req, res, next) => {
  const userId = req.user.toObject()._id;
  const data = await getProcessingData(userId);
  res.status(200).json({
    status: "success",
    data,
  });
});
