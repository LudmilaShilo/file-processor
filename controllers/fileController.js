const multer = require("multer");
const fs = require("fs");
const catchAsync = require("../unit/catchAsync.js");
const File = require("../models/fileModel.js");
const AppError = require("../unit/appError.js");

require("../config.js");

const fileSizeInMB = parseInt(process.env.fileSizeInMB, 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.toObject()._id;
    const uploadDir = `fileStorage/${userId}`;
    // Створюємо директорію, якщо її немає
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: fileSizeInMB * 1024 * 1024 },
}).single("file");

// Проміс для завантаження файлу
const uploadFilePromise = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(req.file);
    });
  });
};

multer({
  storage,
  limits: { fileSize: fileSizeInMB * 1024 * 1024 },
}).single("file");

// Функція завантаження файлу
exports.uploadFile = catchAsync(async (req, res, next) => {
  let uploadedFile;

  try {
    uploadedFile = await uploadFilePromise(req, res);
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("The file exceeds the allowed size", 413));
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
