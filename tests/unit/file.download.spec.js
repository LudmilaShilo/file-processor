let expect;
let sinon;
let sinonChai;
let fileController;
const File = require("../../models/fileModel");
const AppError = require("../../unit/appError");
const AppErrorMock = require("../mocks/AppError");
const uploadFilePromiseMock = require("../mocks/uploadFilePromise");
const proxyquire = require("proxyquire");

describe("uploadFile", () => {
  let req, res, next, findOneAndUpdateStub;

  before(async () => {
    const chaiModule = await import("chai");
    const sinonModule = await import("sinon");
    const sinonChaiModule = await import("sinon-chai");

    sinon = sinonModule.default;
    sinonChai = sinonChaiModule.default;
    chaiModule.use(sinonChai);
    expect = chaiModule.expect;

    findOneAndUpdateStub = sinon.stub(File, "findOneAndUpdate").resolves();

    fileController = proxyquire("../../controllers/fileController", {
      "../unit/uploadFile.js": uploadFilePromiseMock,
      "../unit/appError.js": AppErrorMock,
    });
  });

  beforeEach(() => {
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should upload a file and respond with success if file upload is successful", async () => {
    req = {
      user: { id: "testUserId" },
      file: { originalname: "testFile.txt" },
    };
    await fileController.uploadFile(req, res, next);
    expect(res.status.calledWith(200)).to.be.true;
    expect(
      res.json.calledWith({
        status: "success",
        message: "File uploaded successfully!",
        filename: "testFile.txt",
      })
    ).to.be.true;
  });

  it("should call next with an error if no file is uploaded", async () => {
    req = {
      user: { id: "testUserId" },
    };

    await fileController.uploadFile(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].statusCode).to.equal(400);
    expect(next.firstCall.args[0].message).to.equal(
      "No file uploaded. Please upload a file."
    );
  });

  it("should call next with a 413 error if file size limit exceeded", async () => {
    req = {
      user: { id: "testUserId" },
      file: { originalname: "tooBigFile.txt" },
    };

    await fileController.uploadFile(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].statusCode).to.equal(413);
    expect(next.firstCall.args[0].message).to.equal(
      "The file exceeds the allowed size"
    );
  });

  it("should call next with a 500 error if there is another upload error", async () => {
    req = {
      user: { id: "testUserId" },
      file: "file",
    };
    await fileController.uploadFile(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].statusCode).to.equal(500);
    expect(next.firstCall.args[0].message).to.equal("File upload error");
  });
});
