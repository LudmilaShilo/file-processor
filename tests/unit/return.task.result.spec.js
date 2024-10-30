describe("fileController.returnResult", () => {
  let req, res, next;

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
    await fileController.returnResult(req, res, next);
    expect(next).to.have.been.calledOnceWith(sinon.match.instanceOf(AppError));
  });

  it("should return error if task wasn't created", async () => {
    Redis.get.resolves(null);
    await fileController.returnResult(req, res, next);
    expect(next).to.have.been.calledOnceWith(sinon.match.instanceOf(AppError));
  });

  it("should return error if task isn't ready", async () => {
    Redis.get.resolves("pending");
    await fileController.returnResult(req, res, next);
    expect(next).to.have.been.calledOnceWith(sinon.match.instanceOf(AppError));
  });

  it("should set headers and stream file if task is completed", async () => {
    Redis.get.resolves("completed");
    sinon.stub(fileController, "getFileStream").returns({ pipe: sinon.stub() });
    await fileController.returnResult(req, res, next);
    expect(res.setHeader).to.have.been.calledTwice;
  });
});
