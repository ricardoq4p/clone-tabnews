jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
}));
jest.mock("../lib/models/Candle", () => ({
  __esModule: true,
  default: { findById: jest.fn(), updateOne: jest.fn() },
}));
jest.mock("../lib/models/Message", () => ({ __esModule: true, default: {} }));
jest.mock("../lib/models/Comment", () => ({ __esModule: true, default: {} }));
jest.mock("../lib/models/ModerationLog", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));
jest.mock("../lib/models/AbuseReport", () => ({
  __esModule: true,
  default: { updateMany: jest.fn() },
}));
jest.mock("../lib/pusher", () => ({ notifyChange: jest.fn() }));
import { getServerSession } from "next-auth";
import Candle from "../lib/models/Candle";
import ModerationLog from "../lib/models/ModerationLog";
import review from "../pages/api/admin/revisao";
import moderate from "../pages/api/admin/moderar";
const id = "123456789012345678901234";
const res = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  setHeader: jest.fn(),
});
beforeEach(() => {
  process.env.MONGODB_URI = "mongodb://127.0.0.1/isolated-test-never-connected";
  getServerSession.mockResolvedValue({ user: { id, role: "superadmin" } });
  ModerationLog.create.mockResolvedValue({});
});
afterEach(() => {
  delete process.env.MONGODB_URI;
});
test("ordinary accounts cannot review private content", async () => {
  getServerSession.mockResolvedValue({ user: { id, role: "user" } });
  const response = res();
  await review(
    { method: "GET", query: { type: "candle", id, reason: "Revisão" } },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(403);
  expect(Candle.findById).not.toHaveBeenCalled();
});
test("private review fails closed if auditing is unavailable", async () => {
  ModerationLog.create.mockRejectedValueOnce(new Error("unavailable"));
  const response = res();
  await review(
    { method: "GET", query: { type: "candle", id, reason: "Revisão" } },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(503);
  expect(Candle.findById).not.toHaveBeenCalled();
});
test("administrator must provide a reason before reviewing", async () => {
  const response = res();
  await review({ method: "GET", query: { type: "candle", id } }, response);
  expect(response.status).toHaveBeenCalledWith(400);
  expect(Candle.findById).not.toHaveBeenCalled();
});
test("moderation cannot reactivate a candle withdrawn by its author", async () => {
  Candle.findById.mockReturnValue({
    select: () => ({ lean: async () => ({ status: "withdrawn" }) }),
  });
  const response = res();
  await moderate(
    {
      method: "PATCH",
      body: { type: "candle", id, action: "restore", reason: "Revisão" },
      query: {},
    },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(409);
  expect(Candle.updateOne).not.toHaveBeenCalled();
});

test("restoring visibility never renews a candle or changes its expiration", async () => {
  Candle.findById.mockReturnValue({
    select: () => ({ lean: async () => ({ status: "hidden" }) }),
  });
  const response = res();
  await moderate(
    {
      method: "PATCH",
      body: {
        type: "candle",
        id,
        action: "restore",
        reason: "Revisão",
        expiresAt: "2099-01-01",
      },
      query: {},
    },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(200);
  expect(Candle.updateOne).toHaveBeenCalledWith(
    { _id: id, status: { $ne: "withdrawn" } },
    { $set: { status: "active" } },
  );
});
