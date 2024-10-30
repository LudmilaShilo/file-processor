let expect;
let sinon;
let sinonChai;
let taskController;
let Redis;
let tasksQueue;
const FileMock = require("../mocks/File");
const proxyquire = require("proxyquire");
const AppErrorMock = require("../mocks/AppError");
const getFileStreamMock = require("../mocks/getFileStream");
const fs = require("fs");

describe("task create", () => {
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
      "../models/fileModel.js": FileMock,
      "../redis.js": Redis,
      "../queue.js": tasksQueue,
      "../unit/appError.js": AppErrorMock,
      "../unit/getFileStream.js": getFileStreamMock,
      fs: fs,
    });
  });

  beforeEach(() => {
    req = {
      body: { task: "exampleTask", fileName: "testFile.txt" },
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
    req.body.task = undefined;
    await taskController.create(req, res, next);
    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].statusCode).to.equal(400);
    expect(next.firstCall.args[0].message).to.equal(
      "Send task and file's name"
    );
  });

  it("should return error if task is not implemented", async () => {
    req.body.task = "exampleTask";
    await taskController.create(req, res, next);
    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].statusCode).to.equal(400);
    expect(next.firstCall.args[0].message).to.equal(
      "The task isn't implemented yet"
    );
  });

  it("should return error if file is not found in DB", async () => {
    req.body.task = "task1";
    await taskController.create(req, res, next);
    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].statusCode).to.equal(400);
    expect(next.firstCall.args[0].message).to.equal(
      "File didn't upload. Upload file at first."
    );
  });

  it.skip("should set header and respond with file if status is completed", async () => {
    req.body.fileName = "loadedFile.txt";
    req.body.task = "task2";
    Redis.get.resolves("completed");
    await taskController.create(req, res, next);
    expect(res.setHeader).to.have.been.calledTwice;
    expect(res.status).to.have.been.calledWith(200);
  });

  it("should add task to queue if processing status is not set", async () => {
    req.body.task = "task2";
    req.body.fileName = "loadedFile.txt";
    Redis.get.resolves(null);
    await taskController.create(req, res, next);
    expect(Redis.put).to.have.been.called;
    expect(tasksQueue.add).to.have.been.calledOnce;
    expect(res.status).to.have.been.calledWith(200);
  });
});
