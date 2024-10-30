const uploadFilePromiseMock = (req, res) => {
  return new Promise((resolve, reject) => {
    if (req.file?.originalname === "tooBigFile.txt") {
      const error = new Error("The file exceeds the allowed size");
      error.code = "LIMIT_FILE_SIZE";
      error.statusCode = 413;
      return reject(error);
    }
    if (req.file?.originalname) {
      return resolve(req.file);
    }
    if (!req.file) {
      console.log("in if !req.file");
      return resolve(null);
    }
    const error = new Error("File upload error");
    error.statusCode = 500;
    reject(error);
  });
};

module.exports = uploadFilePromiseMock;
