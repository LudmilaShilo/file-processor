const plans = {
  ProUpload: "Pro Upload",
};

const tasks = {
  task1: "task1",
  task2: "task2",
};

const taskHandlers = {
  task1: (chunk) => chunk.toUpperCase(),
  task2: (chunk) => chunk.toLowerCase(),
};

const status = {
  pending: "pending",
  inProgress: "in progress",
  incomplete: "incomplete",
  completed: "completed",
  failed: "failed",
};

module.exports = { plans, tasks, status, taskHandlers };
