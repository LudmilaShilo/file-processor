import { jest } from "@jest/globals";
import { uploadFile } from "../../controllers/fileController.js";
import { AppError } from "../../unit/appError.js";

jest.mock("../../models/fileModel.js");

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
      cb(new Error());
    }),
  });
  return multerMock;
});

describe.skip("normal file did't download", () => {
  const req = {
    user: { id: "userId" },
    file: { originalname: "test.txt" },
  };
  it("should return 500 when file did't download", async () => {
    await uploadFile(req, res, next);

    expect(res).toHaveBeenCalledWith(expect.any(AppError));
    const errorInstance = next.mock.calls[0][0];
    expect(errorInstance.message).toBe("File upload error");
    expect(errorInstance.statusCode).toBe(500);
  });
});
