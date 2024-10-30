const fs = require("fs");
const catchAsync = require("../unit/catchAsync.js");
const File = require("../models/fileModel.js");
const AppError = require("../unit/appError.js");
const uploadFilePromise = require("../unit/uploadFile.js");

require("../config.js");

// Функція завантаження файлу
const uploadFile = catchAsync(async (req, res, next) => {
  console.log("uploadFile start");
  let uploadedFile;

  try {
    uploadedFile = await uploadFilePromise(req, res);
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      const error = new Error("The file exceeds the allowed size");
      error.statusCode = 413;
      return next(error);
    }
    return next(new AppError("File upload error", 500));
  }

  // Перевірка, чи файл був завантажений
  if (!uploadedFile) {
    return next(new AppError("No file uploaded. Please upload a file.", 400));
  }

  // Вдало збережений файл, зберігаємо інформацію в БД
  await File.findOneAndUpdate(
    { name: uploadedFile.originalname, user: req.user.id },
    {
      $set: {
        user: req.user.id,
        name: uploadedFile.originalname,
      },
    },
    { upsert: true, new: true }
  );

  res.status(200).json({
    status: "success",
    message: "File uploaded successfully!",
    filename: uploadedFile.originalname,
  });
});

module.exports = { uploadFile };
