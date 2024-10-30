const AppError = require("../unit/appError");

class AppErrorMock {
  constructor(message, statusCode) {
    this.statusCode = this.statusCode || 500;
    this.message = message;
  }
}

const error = new AppErrorMock("Ok", 200);

console.log(error);
