jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
}));
jest.mock("../lib/models/RosaryProgress", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock("../lib/rosary/editions", () => ({ getRosaryContent: jest.fn() }));
import { getServerSession } from "next-auth";
import Progress from "../lib/models/RosaryProgress";
import { getRosaryContent } from "../lib/rosary/editions";
import { DEFAULT_CONTENT } from "../lib/rosary/content";
import { newProgress } from "../lib/rosary/engine";
import handler from "../pages/api/rosario/progresso";
const res = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  setHeader: jest.fn(),
});
beforeEach(() => {
  process.env.MONGODB_URI = "mongodb://127.0.0.1/test-never-connected";
  getServerSession.mockResolvedValue({ user: { id: "account-id" } });
  getRosaryContent.mockResolvedValue(DEFAULT_CONTENT);
});
afterEach(() => {
  delete process.env.MONGODB_URI;
});
test("a stale revision returns a conflict instead of overwriting another device", async () => {
  Progress.findOneAndUpdate.mockResolvedValue(null);
  Progress.findOne.mockReturnValue({
    lean: async () => ({
      ...newProgress("dolorosos"),
      revision: 4,
      position: 12,
    }),
  });
  const response = res();
  await handler(
    {
      method: "PUT",
      body: {
        accountId: "account-id",
        progress: newProgress("gozosos"),
        expectedRevision: 3,
      },
    },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(409);
  expect(response.json).toHaveBeenCalledWith(
    expect.objectContaining({
      revision: 4,
      progress: expect.objectContaining({ setId: "dolorosos", position: 12 }),
    }),
  );
});
test("progress always belongs to the session, never the supplied user ID", async () => {
  Progress.create.mockImplementation(async (value) => value);
  const response = res();
  await handler(
    {
      method: "PUT",
      body: {
        accountId: "account-id",
        progress: { ...newProgress("gozosos"), userId: "other-account" },
        expectedRevision: 0,
      },
    },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(200);
  expect(Progress.create).toHaveBeenCalledWith(
    expect.objectContaining({ userId: "account-id" }),
  );
});
test("a new session cannot overwrite a concurrently created saved route", async () => {
  Progress.create.mockRejectedValueOnce({ code: 11000 });
  Progress.findOne.mockReturnValue({
    lean: async () => ({ ...newProgress("gozosos"), revision: 1 }),
  });
  const response = res();
  await handler(
    {
      method: "PUT",
      body: {
        accountId: "account-id",
        progress: newProgress("gozosos"),
        expectedRevision: 0,
      },
    },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(409);
});
test("invalid step indexes cannot be saved", async () => {
  const response = res();
  await handler(
    {
      method: "PUT",
      body: {
        accountId: "account-id",
        progress: { ...newProgress("gozosos"), position: 9999 },
        expectedRevision: 0,
      },
    },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(400);
  expect(Progress.create).not.toHaveBeenCalled();
});

test("a save queued under another identity cannot overwrite the current account", async () => {
  const response = res();
  await handler(
    {
      method: "PUT",
      body: {
        accountId: "another-account",
        progress: newProgress("gozosos"),
        expectedRevision: 0,
      },
    },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(401);
  expect(Progress.create).not.toHaveBeenCalled();
});
