const Queue = require("bull");
const Redis = require("./redis");

console.log("queue.js start");

const tasksQueue = new Queue("tasksQueue", {
  createClient: function (type) {
    switch (type) {
      case "client":
        return Redis.clientQueue;
      case "subscriber":
        return Redis.clientQueue.duplicate();
      default:
        return Redis.clientQueue;
    }
  },
});

module.exports = tasksQueue;
