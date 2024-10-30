require("../config.js");
const tasksQueue = require("../queue.js");
const { processTask } = require("./worker.js");

const numOfWorkers = parseInt(process.env.NUM_OF_WORKERS) || 2;
try {
  tasksQueue.process(numOfWorkers, processTask);
} catch (err) {
  console.error("in taskQueue.js err", err);
}

console.log(`${numOfWorkers} workers started`);

tasksQueue.on("completed", (job, result) => {
  console.log(`Job completed with result:`, result, JSON.stringify(job.data));
});

tasksQueue.on("failed", (job, error) => {
  console.error(`Job failed with error:`, error, JSON.stringify(job.data));
});
