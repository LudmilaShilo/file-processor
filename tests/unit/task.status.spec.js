let expect;
let sinon;
let sinonChai;
const taskController = require("../../controllers/taskController");

describe("get task status", () => {
  let req, res, next;

  before(async () => {
    const chaiModule = await import("chai");
    const sinonModule = await import("sinon");
    const sinonChaiModule = await import("sinon-chai");

    sinon = sinonModule.default;
    sinonChai = sinonChaiModule.default;
    chaiModule.use(sinonChai);
    expect = chaiModule.expect;
  });

  beforeEach(() => {
    req = { user: { toObject: () => ({ _id: "testUserId" }) } };
    res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
    next = sinon.stub();
    sinon.resetHistory();
  });

  it.skip("should return all processing data for the user", async () => {
    sinon
      .stub(taskController, "getProcessingData")
      .resolves([
        { fileName: "file1.txt", task: "task1", status: "completed" },
      ]);
    await taskController.getStatus(req, res, next);
    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({
      status: "success",
      data: [{ fileName: "file1.txt", task: "task1", status: "completed" }],
    });
  });
});
