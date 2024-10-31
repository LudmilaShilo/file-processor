const fs = require("fs");
const path = require("path");
const { parentPort, workerData } = require("worker_threads");
const { Transform } = require("stream");
const constants = require("../constants");
const Redis = require("../redis");
const File = require("../models/fileModel");
const { clients } = require("../controllers/statusController");
const queue = require("../queue");
require("../config");

const processData = async (data) => {
  const { task, fileName, userId } = data;
  const MAX_ATTEMPTS = process.env.MAX_ATTEMPTS;
  const TIME_LIMIT = process.env.TIME_LIMIT_SEC * 1000;
  const CHUNK_SIZE = process.env.CHUNK_SIZE_KB * 1024;
  const statusKey = `processing:${userId}:${fileName}:${task}`;
  await Redis.put(statusKey, constants.status.inProgress);
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

  const retryKey = `retries:${userId}:${fileName}:${task}`;
  const retry = await Redis.get(retryKey);
  let attempts = retry ? JSON.parse(retry).attempts : 0;
  const start = retry ? JSON.parse(retry).position : 0;

  if (attempts >= MAX_ATTEMPTS) {
    Redis.put(statusKey, constants.status.failed);
    Redis.remove(retryKey);
    parentPort.postMessage({ error: "Maximum attempts reached" });
    return;
  }

  let isTimedOut = false;

  setTimeout(() => {
    isTimedOut = true;
  }, TIME_LIMIT);

  const processChunk = (start) => {
    if (isTimedOut) {
      return;
    }
    const readStream = fs.createReadStream(inputFilePath, {
      encoding: "utf-8",
      start,
      end: start + CHUNK_SIZE - 1,
    });
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
    const writeStream = fs.createWriteStream(outputFilePath, { flags: "a" });
    readStream
      .pipe(transformStream)
      .pipe(writeStream)
      .on("finish", async () => {
        const newPosition = start + CHUNK_SIZE;
        if (newPosition >= fs.statSync(inputFilePath).size) {
          Redis.put(statusKey, constants.status.completed);
          Redis.remove(retryKey);
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
        } else if (isTimedOut) {
          Redis.put(
            retryKey,
            JSON.stringify({ attempts: attempts + 1, position: newPosition })
          );
          Redis.put(statusKey, constants.status.incomplete);
          parentPort.postMessage({ error: "Task timed out" });
          await queue.add({ userId, fileName, task });
        } else {
          processChunk(newPosition);
        }
      })
      .on("error", async (error) => {
        Redis.put(
          retryKey,
          JSON.stringify({ attempts: attempts + 1, position: start })
        );
        Redis.put(statusKey, constants.status.incomplete);
        queue.add({ userId, fileName, task });
        parentPort.postMessage({ error: error.message });
      });
  };

  processChunk(start);
};

processData(workerData);

module.exports = { processData };
