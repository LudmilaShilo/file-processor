const plans = {
  ProUpload: "Pro Upload",
};

const tasks = {
  task1: "task1",
  task2: "task2",
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const taskHandlers = {
  task1: (chunk) => chunk.toUpperCase(),
  task2: (chunk) => chunk.toLowerCase(),
};

module.exports = taskHandlers;

const status = {
  pending: "pending",
  inProgress: "in progress",
  incomplete: "incomplete",
  completed: "completed",
  failed: "failed",
};

module.exports = { plans, tasks, status, taskHandlers };
