require("../config.js");
const tasksQueue = require("../queue.js");
const { processTask } = require("./worker.js");

const numOfWorkers = parseInt(process.env.NUM_OF_WORKERS) || 2;
const maxRetries = process.env.MAX_RETRIES_WORKER_START || 5;
const retryDelay = process.env.RETRY_WORKER_START_DELAY || 2000;
try {
  tasksQueue.process(numOfWorkers, processTask);
} catch (err) {
  console.error("Error starting workers:", err);
  if (retries < maxRetries) {
    console.log(
      `Retrying to start workers... Attempt ${retries + 1} of ${maxRetries}`
    );
    setTimeout(() => startWorkers(retries + 1), retryDelay);
  } else {
    console.error("Max retries reached. Exiting the process.");
    process.exit(1);
  }
}

console.log(`${numOfWorkers} workers start`);

tasksQueue.on("completed", (job, result) => {
  console.log(`Job completed with result:`, result, JSON.stringify(job.data));
});

tasksQueue.on("failed", (job, error) => {
  console.error(`Job failed with error:`, error, JSON.stringify(job.data));
});
