require("../config.js");
const multer = require("multer");

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
  console.log("in uploadFilePromise");
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

module.exports = uploadFilePromise;