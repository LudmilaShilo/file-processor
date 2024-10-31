const fs = require("fs");
const catchAsync = require("../unit/catchAsync.js");
const File = require("../models/fileModel.js");
const AppError = require("../unit/appError.js");
const uploadFilePromise = require("../unit/uploadFile.js");

require("../config.js");

const uploadFile = catchAsync(async (req, res, next) => {
  let uploadedFile;

  try {
    uploadedFile = await uploadFilePromise(req, res);
  } catch (err) {
    console.log(err);
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("The file exceeds the allowed size", 413));
    }
    return next(new AppError("File upload error", 500));
  }

  if (!uploadedFile) {
    return next(new AppError("No file uploaded. Please upload a file.", 400));
  }

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
