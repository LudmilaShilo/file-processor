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
      cb(null, "file");
    }),
  });
  return multerMock;
});

describe.skip("normal file", () => {
  it("should return 200 when file size in limit", async () => {
    await uploadFile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "File uploaded successfully!",
      filename: "test.txt",
    });
  });
});
