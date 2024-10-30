const fs = require("fs");
const path = require("path");
const { parentPort, workerData } = require("worker_threads");
const { Transform } = require("stream");
const constants = require("../constants");
const Redis = require("../redis");
const File = require("../models/fileModel");
const { clients } = require("../controllers/statusController");

const processData = (data) => {
  const { task, fileName, userId } = data;
  Redis.put(
    `processing:${userId}:${fileName}:${task}`,
    constants.status.inProgress
  );
  const inputFilePath = path.join(
    __dirname,
    `../fileStorage/${userId}/${fileName}`
  );
  const outputFilePath = path.join(
    __dirname,
    `../fileStorage/${userId}/${task}/${fileName}`
  );

  const directoryPath = path.dirname(outputFilePath);

  fs.mkdir(directoryPath, { recursive: true }, (err) => {
    if (err) {
      console.error("Error creating directory:", err);
      return;
    }
  });

  const readStream = fs.createReadStream(inputFilePath, { encoding: "utf-8" });

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      const chunkString = chunk.toString();
      if (constants.taskHandlers[task]) {
        const result = constants.taskHandlers[task](chunkString);
        callback(null, result);
      } else {
        callback(new Error("Unknown task"));
      }
    },
  });

  const writeStream = fs.createWriteStream(outputFilePath);

  readStream
    .pipe(transformStream)
    .pipe(writeStream)
    .on("finish", async () => {
      Redis.put(
        `processing:${userId}:${fileName}:${task}`,
        constants.status.completed
      );
      if (clients[userId]) {
        clients[userId].write(
          `data: ${JSON.stringify({
            fileName,
            task,
            status: constants.status.failed,
          })}\n\n`
        );
      }
      parentPort.postMessage({
        status: "completed",
        message: "File processed successfully.",
      });
    })
    .on("error", (error) => {
      Redis.put(
        `processing:${userId}:${fileName}:${task}`,
        constants.status.failed
      );
      parentPort.postMessage({ error: error.message });
    });
};

try {
  processData(workerData);
} catch (error) {
  parentPort.postMessage({ error: error.message });
}
