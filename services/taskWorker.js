const fs = require("fs");
const path = require("path");
const { parentPort, workerData } = require("worker_threads");
const { Transform } = require("stream");
const constants = require("../constants");
const Redis = require("../redis");
const File = require("../models/fileModel");
const { clients } = require("../controllers/statusController");
console.log("services/taskWorker.js start");

// Функція для обробки даних за допомогою потоків
const processData = (data) => {
  const { task, fileName, userId } = data;
  console.log("in taskWorker", { task, fileName, userId });
  Redis.put(
    `processing:${userId}:${fileName}:${task}`,
    constants.status.inProgress
  );
  console.log("in taskWorker Redis change status on pending");
  const inputFilePath = path.join(
    __dirname,
    `../fileStorage/${userId}/${fileName}`
  );
  const outputFilePath = path.join(
    __dirname,
    `../fileStorage/${userId}/${task}/${fileName}`
  );

  // Отримуємо шлях до директорії
  const directoryPath = path.dirname(outputFilePath);

  // Створюємо директорію, якщо вона не існує
  fs.mkdir(directoryPath, { recursive: true }, (err) => {
    if (err) {
      console.error("Error creating directory:", err);
      return;
    }
  });

  // Створюємо потік для читання файлу
  const readStream = fs.createReadStream(inputFilePath, { encoding: "utf-8" });

  // Створюємо трансформуючий потік для обробки даних
  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      const chunkString = chunk.toString();
      if (constants.taskHandlers[task]) {
        const result = constants.taskHandlers[task](chunkString);
        //const result = chunkString.toLowerCase();
        callback(null, result);
      } else {
        callback(new Error("Unknown task"));
      }
    },
  });

  // Створюємо потік для запису результату
  const writeStream = fs.createWriteStream(outputFilePath);

  // Об'єднуємо потоки
  readStream
    .pipe(transformStream) // Потокове перетворення даних
    .pipe(writeStream) // Запис результатів
    .on("finish", async () => {
      Redis.put(
        `processing:${userId}:${fileName}:${task}`,
        constants.status.completed
      );
      console.log("in taskWorker Redis change status on completed");
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
      console.log("in taskWorker Redis change status on failed");
      parentPort.postMessage({ error: error.message });
    });
};

try {
  processData(workerData);
} catch (error) {
  parentPort.postMessage({ error: error.message });
}
