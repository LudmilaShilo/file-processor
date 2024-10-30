import { jest } from "@jest/globals";
import { uploadFile } from "../../controllers/fileController.js";

jest.mock("../../models/fileModel.js");

const req = {
  user: { id: "userId" },
  file: { originalname: "test.txt" },
};

const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};

const next = jest.fn();

jest.mock("multer", () => {
  const multerMock = jest.fn();
  multerMock.diskStorage = jest.fn();
  multerMock.mockReturnValue({
    single: jest.fn((fieldName) => (req, res, cb) => {
      cb({ code: "LIMIT_FILE_SIZE" });
    }),
  });
  return multerMock;
});

describe.skip("too big file", () => {
  it("should return 413 when file size exceeds limit", async () => {
    await uploadFile(req, res);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      status: "fail",
      error: "The file exceeds the allowed size",
    });
  });
});
