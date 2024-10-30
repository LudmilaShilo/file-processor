const express = require("express");

const AppError = require("./unit/appError.js");
const globalErrorHandler = require("./controllers/errorController.js");

const userRouter = require("./routers/userRouter.js");
const fileRouter = require("./routers/fileRouter.js");
const taskRouter = require("./routers/taskRouter.js");
const statusRouter = require("./routers/statusRouter.js");

const app = express();
app.use(express.json());

// Routers

app.use("/api/v1/users", userRouter);
app.use("/api/v1/files", fileRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/statuses", statusRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`The endpoint ${req.originalUrl} doesn't exist`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
