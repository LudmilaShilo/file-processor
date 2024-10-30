const fs = require("fs");
const path = require("path");

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

module.exports = getFileStream;
