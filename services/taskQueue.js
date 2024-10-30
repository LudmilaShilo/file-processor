require("../config.js");
const tasksQueue = require("../queue.js");
const { processTask } = require("./worker.js");

console.log("services/taskQueue.js start");

(async () => {
  const jobCounts = await tasksQueue.getJobCounts();
  console.log("Job Counts:", jobCounts);
})();

// Ініціалізуємо N воркерів для обробки черги
const numOfWorkers = parseInt(process.env.NUM_OF_WORKERS) || 2;
try {
  tasksQueue.process(numOfWorkers, processTask);
} catch (err) {
  console.log("in taskQueue.js err", err);
}

console.log(`${numOfWorkers} воркери запущено для обробки черги.`);

tasksQueue.on("completed", (job, result) => {
  console.log(`Job completed with result:`, result, JSON.stringify(job.data));
});

tasksQueue.on("failed", (job, error) => {
  console.error(`Job failed with error:`, error, JSON.stringify(job.data));
});
