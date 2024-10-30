const AppError = require("../unit/appError.js");
require("../config.js");

const sendDevErr = (err, req, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendProdErr = (err, req, res) => {
  // Operation trusted error
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Others errors

  // log error
  console.error("ERROR>>>>>", err);
  // send a message to a client
  return res.status(500).render({
    title: "Something went wrong",
    message: "Please, try again later",
  });
};

const handleMongoError = (err) => {
  const message = `The field ${err.path} has incorrect value ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateField = (err) => {
  const message = `The value '${err?.keyValue?.name}' already uses. Pls, use another value.`;
  return new AppError(message, 400);
};

const handleValidationDbError = (errors) => {
  let message = "Input data errors: ";
  const messages = Object.keys(errors).map((key) => errors[key].message);
  message += messages.join(". ") + ".";
  return new AppError(message, 400);
};

const handleJwtError = () =>
  new AppError("Your token is invalid. Pls, log in again.");

const handleJwtExpiredError = () =>
  new AppError("Your token is expired. Pls, log in again.");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendDevErr(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err }; // copy not all the data
    error.message = err.message;

    if (err.name === "CastError") {
      error = handleMongoError(err);
      sendProdErr(error, req, res);
      return;
    }
    if (err.code === 11000) {
      error = handleDuplicateField(err);
      sendProdErr(error, req, res);
      return;
    }
    if (err.errors) {
      error = handleValidationDbError(err.errors);
      sendProdErr(error, req, res);
      return;
    }
    if (err.name === "JsonWebTokenError") {
      error = handleJwtError();
      sendProdErr(error, req, res);
      return;
    }
    if (err.name === "TokenExpiredError") {
      error = handleJwtExpiredError();
      sendProdErr(error, req, res);
      return;
    }
    sendProdErr(err, req, res);
  }
};
