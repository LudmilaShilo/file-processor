let expect;
let sinon;
let sinonChai;
const fs = require("fs");
const path = require("path");
const { Transform } = require("stream");
const Redis = require("../redis");
const constants = require("../constants");
const { parentPort } = require("worker_threads");
const { processData } = require("../worker");

describe("processData", () => {
  const userId = "user123";
  const fileName = "testFile.txt";
  const task = "someTask";
  const data = { userId, fileName, task };
  const inputFilePath = path.join(
    __dirname,
    `../fileStorage/${userId}/${fileName}`
  );
  const outputFilePath = path.join(
    __dirname,
    `../fileStorage/${userId}/${task}/${fileName}`
  );

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
    sinon.stub(Redis, "put").resolves();
    sinon.stub(Redis, "get").resolves(null);
    sinon.stub(fs, "mkdirSync");
    sinon.stub(fs, "createReadStream");
    sinon.stub(fs, "statSync").returns({ size: 100 }); // Задаємо розмір файлу
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should process data successfully", async () => {
    const mockWriteStream = {
      on: sinon.stub().callsArgWith(1),
      pipe: sinon.stub().returnsThis(),
    };

    fs.createReadStream.returns({
      on: sinon.stub().callsArgWith(1),
      pipe: sinon.stub().returnsThis(),
    });
    sinon.stub(fs, "createWriteStream").returns(mockWriteStream);

    // Задаємо поведінку для taskHandlers
    constants.taskHandlers[task] = (chunk) => `Processed: ${chunk}`;

    await processData(data);

    expect(
      Redis.put.calledWith(
        `processing:${userId}:${fileName}:${task}`,
        constants.status.inProgress
      )
    ).to.be.true;
    expect(
      Redis.put.calledWith(
        `processing:${userId}:${fileName}:${task}`,
        constants.status.completed
      )
    ).to.be.true;
    expect(mockWriteStream.on.calledWith("finish")).to.be.true;
  });

  it.skip("should handle timeout", async () => {
    const mockWriteStream = {
      on: sinon.stub().callsArgWith(1),
      pipe: sinon.stub().returnsThis(),
    };

    fs.createReadStream.returns({
      on: sinon.stub().callsArgWith(1),
      pipe: sinon.stub().returnsThis(),
    });
    sinon.stub(fs, "createWriteStream").returns(mockWriteStream);

    // Задаємо поведінку для taskHandlers
    constants.taskHandlers[task] = (chunk) => `Processed: ${chunk}`;

    // Задаємо таймаут
    process.env.TIME_LIMIT_SEC = 0.01; // 10 мс
    await processData(data);

    // Чекаємо на таймаут
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(
      Redis.put.calledWith(
        `retries:${userId}:${fileName}:${task}`,
        sinon.match.string
      )
    ).to.be.true;
    expect(
      Redis.put.calledWith(
        `processing:${userId}:${fileName}:${task}`,
        constants.status.incomplete
      )
    ).to.be.true;
    expect(parentPort.postMessage.calledWith({ error: "Task timed out" })).to.be
      .true;
  });

  it.skip("should fail after reaching max attempts", async () => {
    Redis.get.resolves(JSON.stringify({ attempts: 3, position: 0 })); // Імітуємо, що максимальна кількість спроб досягнута
    process.env.MAX_ATTEMPTS = 3;

    await processData(data);

    expect(
      Redis.put.calledWith(
        `processing:${userId}:${fileName}:${task}`,
        constants.status.failed
      )
    ).to.be.true;
    expect(
      parentPort.postMessage.calledWith({ error: "Maximum attempts reached" })
    ).to.be.true;
  });
});
