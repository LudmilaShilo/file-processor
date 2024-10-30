const mongoose = require("mongoose");
const app = require("./app.js");
require("./config.js");
require("./services/worker");
require("./services/taskQueue");

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception !!!!!!");
  const stack = err.stack.split("\n");
  console.error(`${stack[0]}\n${stack[1]}`);
  console.error(err.stack);

  process.exit(1);
});

const mongoConnectionString = process.env.mongoConnectionString;

mongoose
  .connect(mongoConnectionString)
  .then(() => console.info("Mongo Connected!"));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.info("app.js::::8 >>>", `server listen on PORT ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection !!!!!!");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
