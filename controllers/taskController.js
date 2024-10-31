const catchAsync = require("../unit/catchAsync.js");
const constants = require("../constants.js");
const AppError = require("../unit/appError.js");
const File = require("../models/fileModel.js");
const Redis = require("../redis.js");
const tasksQueue = require("../queue.js");
const getFileStream = require("../unit/getFileStream.js");
const fs = require("fs");

const isProcessingSupported = (task) => {
  return !!constants.tasks[task];
};

const create = catchAsync(async (req, res, next) => {
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

  if (status === constants.status.completed) {
    const fileStream = getFileStream({ userId, fileName, task });
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    fileStream.pipe(res);
    return;
  }
  if (status && status !== constants.status.failed) {
    return res.status(200).json({
      status: "success",
    });
  }

  Redis.put(
    `processing:${userId}:${fileName}:${task}`,
    constants.status.pending
  );

  tasksQueue.add({ task, fileName, userId });
  res.status(200).json({
    status: "success",
  });
});

const returnResult = catchAsync(async (req, res, next) => {
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
  res.setHeader("Content-Type", "application/octet-stream");
  fileStream.pipe(res);
  return;
});

module.exports = { returnResult, create };
