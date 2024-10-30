let expect;
let sinon;
let sinonChai;
let chai;
let fileController;
//const fileController = require("../../controllers/fileController");
// console.log("fileController keys", Object.keys(fileController));
const File = require("../../models/fileModel");
const AppError = require("../../unit/appError");
const AppErrorMock = require("../mocks/AppError");
const proxyquire = require("proxyquire");

describe("uploadFile test", () => {
  let req, res, next, uploadFilePromiseStub, findOneAndUpdateStub;

  before(async () => {
    const chaiModule = await import("chai");
    const sinonModule = await import("sinon");
    const sinonChaiModule = await import("sinon-chai");

    sinon = sinonModule.default;
    sinonChai = sinonChaiModule.default;
    chaiModule.use(sinonChai);
    expect = chaiModule.expect;

    // Stubbing dependencies
    const uploadFilePromiseMock = (req, res) => {
      console.log("in uploadFilePromiseMock");
      return new Promise((resolve, reject) => {
        console.log("in uploadFilePromiseMock promise start");
        if (req.file?.originalname) {
          return resolve(req.file);
        }
        if (!req.file) {
          const error = new Error("No file uploaded. Please upload a file.");
          error.statusCode = 400;
          return reject(error);
        }
        const error = new Error("The file exceeds the allowed size");
        error.statusCode = 413;
        reject(error);
      });
    };
    findOneAndUpdateStub = sinon.stub(File, "findOneAndUpdate").resolves();

    // Заміняємо модуль
    fileController = proxyquire("../../controllers/fileController", {
      "../unit/uploadFile.js": uploadFilePromiseMock,
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
    sinon.restore(); // Restores original methods and clears mocks
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

  it.skip("should call next with an AppError if no file is uploaded", async () => {
    req = {
      user: { id: "testUserId" },
    };

    if (res.status.called) {
      console.log("res.status value:", res.status.firstCall.args[0]);
    } else {
      console.log("res.status was not called.");
    }

    if (res.json.called) {
      console.log("res.json value:", res.json.firstCall.args[0]);
    } else {
      console.log("res.json was not called.");
    }

    await fileController.uploadFile(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.be.an.instanceOf(AppError);
    expect(next.firstCall.args[0].message).to.equal(
      "No file uploaded. Please upload a file."
    );
  });

  it.skip("should call next with a 413 AppError if file size limit exceeded", async () => {
    const error = new Error("The file exceeds the allowed size");
    error.code = "LIMIT_FILE_SIZE";
    uploadFilePromiseStub.rejects(error);

    await fileController.uploadFile(req, res, next);

    if (res.status.called) {
      console.log("res.status value:", res.status.firstCall.args[0]);
    } else {
      console.log("res.status was not called.");
    }

    if (res.json.called) {
      console.log("res.json value:", res.json.firstCall.args[0]);
    } else {
      console.log("res.json was not called.");
    }

    expect(next.calledOnce).to.be.true;
    //expect(next.firstCall.args[0]).to.be.an.instanceOf(AppError);
    //expect(next.firstCall.args[0].statusCode).to.equal(413);
  });

  it.skip("should call next with a 500 AppError if there is another upload error", async () => {
    uploadFilePromiseStub.rejects(new Error("General error"));

    await fileController.uploadFile(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.be.an.instanceOf(AppError);
    expect(next.firstCall.args[0].statusCode).to.equal(500);
  });
});
