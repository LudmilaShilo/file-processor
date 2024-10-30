const { Worker } = require("worker_threads");
const path = require("path");

exports.processTask = async (job) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, "taskWorker.js"), {
      workerData: job.data, // job.data = { task, fileName, userId }
    });

    const { task, fileName, userId } = job.data;

    worker.on("message", (result) => {
      resolve(result);
    });

    worker.on("error", (error) => {
      reject(error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker exit with ${code}`));
      }
    });
  });
};
