const { Worker } = require("worker_threads");
const path = require("path");
console.log("services/worker.js start");

// Основна функція, яка створює воркер для кожного завдання
exports.processTask = async (job) => {
  console.log("start processTask with job.data", job.data);
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, "taskWorker.js"), {
      workerData: job.data, // job.data = { task, fileName, userId }
    });

    const { task, fileName, userId } = job.data;

    worker.on("message", (result) => {
      console.log("Результат від воркера", { task, fileName, userId, result });
      resolve(result);
    });

    worker.on("error", (error) => {
      console.error("Помилка у воркері", { task, fileName, userId, error });
      reject(error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Воркер завершив роботу з кодом ${code}`));
      }
    });
  });
};
