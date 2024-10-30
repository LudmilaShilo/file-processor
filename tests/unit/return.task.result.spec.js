let expect;
let sinon;
let sinonChai;
let taskController;
let Redis;
const proxyquire = require("proxyquire");
const AppErrorMock = require("../mocks/AppError");
const getFileStreamMock = require("../mocks/getFileStream");
const fs = require("fs");

describe("taskController.returnResult", () => {
  let req, res, next;

  before(async () => {
    const chaiModule = await import("chai");
    const sinonModule = await import("sinon");
    const sinonChaiModule = await import("sinon-chai");

    sinon = sinonModule.default;
    sinonChai = sinonChaiModule.default;
    chaiModule.use(sinonChai);
    expect = chaiModule.expect;

    Redis = {
      get: sinon.stub(),
      put: sinon.stub(),
    };
    tasksQueue = {
      add: sinon.stub(),
      getJobCounts: sinon.stub(),
    };
    taskController = proxyquire("../../controllers/taskController", {
      "../redis.js": Redis,
      "../queue.js": tasksQueue,
      "../unit/appError.js": AppErrorMock,
      "../unit/getFileStream.js": getFileStreamMock,
      fs: fs,
    });
  });

  beforeEach(() => {
    req = {
      query: { task: "exampleTask", fileName: "testFile.txt" },
      user: { toObject: () => ({ _id: "testUserId" }) },
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      setHeader: sinon.stub(),
    };
    next = sinon.stub();
    sinon.resetHistory();
  });

  it("should return error if task or fileName is missing", async () => {
    req.query.task = undefined;
    await taskController.returnResult(req, res, next);
    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].statusCode).to.equal(400);
    expect(next.firstCall.args[0].message).to.equal(
      "Send task and file's name"
    );
  });

  it("should return error if task wasn't created", async () => {
    Redis.get.resolves(null);
    await taskController.returnResult(req, res, next);
    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].statusCode).to.equal(400);
    expect(next.firstCall.args[0].message).to.equal(
      "The task wasn't created. Create task at the first"
    );
  });

  it("should return error if task isn't ready", async () => {
    Redis.get.resolves("pending");
    await taskController.returnResult(req, res, next);
    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].statusCode).to.equal(400);
    expect(next.firstCall.args[0].message).to.equal(
      "The task isn't ready. It's status is pending"
    );
  });

  it("should set headers and stream file if task is completed", async () => {
    Redis.get.resolves("completed");
    await taskController.returnResult(req, res, next);
    expect(res.setHeader).to.have.been.calledTwice;
  });
});
