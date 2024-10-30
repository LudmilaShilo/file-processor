describe("fileController.getStatus", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { toObject: () => ({ _id: "testUserId" }) } };
    res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
    next = sinon.stub();
    sinon.resetHistory();
  });

  it("should return all processing data for the user", async () => {
    sinon
      .stub(fileController, "getProcessingData")
      .resolves([
        { fileName: "file1.txt", task: "task1", status: "completed" },
      ]);
    await fileController.getStatus(req, res, next);
    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({
      status: "success",
      data: [{ fileName: "file1.txt", task: "task1", status: "completed" }],
    });
  });
});
