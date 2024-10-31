require("../config.js");
const multer = require("multer");
const fs = require("fs");

const FILE_SIZE_MB = parseInt(process.env.FILE_SIZE_MB, 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.toObject()._id;
    const uploadDir = `fileStorage/${userId}`;
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
  limits: { fileSize: FILE_SIZE_MB * 1024 * 1024 },
}).single("file");

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
  limits: { fileSize: FILE_SIZE_MB * 1024 * 1024 },
}).single("file");

module.exports = uploadFilePromise;
