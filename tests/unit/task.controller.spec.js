import { jest } from "@jest/globals";
import { tasks } from "../../constants";
import {
  isProcessingSupported,
  create,
} from "../../controllers/taskController";

const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};

/* const next = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
}); */

describe("is processing supported", () => {
  it("task not implemented yet", () => {
    expect(isProcessingSupported("unknown task")).toBe(false);
  });
  it("task already implemented", () => {
    expect(isProcessingSupported("task1")).toBe(true);
  });
  it("task is undefined", () => {
    expect(isProcessingSupported(undefined)).toBe(false);
  });
});
/* 
describe("create task", () => {
  it("should return 400 if task isn't implemented yet", async () => {
    const req = {
      body: {
        task: "unknown task",
      },
    };
    await create(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "fail",
      error: "The task isn't implemented yet",
    });
  });
});
 */
