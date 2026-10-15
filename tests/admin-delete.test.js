jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/community-deletion", () => ({
  deleteCommunityContent: jest.fn(async () => ({ success: true })),
}));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
}));
import { getServerSession } from "next-auth";
import { deleteCommunityContent } from "../lib/community-deletion";
import handler from "../pages/api/admin/excluir";
const id = "123456789012345678901234";
const response = () => ({
  setHeader: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});
beforeEach(() => {
  process.env.MONGODB_URI = "mongodb://127.0.0.1/isolated";
  getServerSession.mockResolvedValue({ user: { id, role: "superadmin" } });
});
afterEach(() => {
  delete process.env.MONGODB_URI;
});
test.each([
  [null, 401],
  [{ user: { id, role: "user" } }, 403],
  [{ user: { id, role: "admin" } }, 403],
])(
  "rejects an unauthorized session without deleting anything",
  async (session, status) => {
    getServerSession.mockResolvedValue(session);
    const res = response();
    await handler(
      { method: "DELETE", body: { type: "message", id, reason: "Review" } },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(status);
    expect(deleteCommunityContent).not.toHaveBeenCalled();
  },
);
test.each(["message", "comment"])(
  "superadmin can delete a %s only with a reason",
  async (type) => {
    const res = response();
    await handler(
      { method: "DELETE", body: { type, id, reason: "Content review" } },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(deleteCommunityContent).toHaveBeenCalledWith(
      type,
      id,
      expect.any(Object),
      { adminOnly: true, reason: "Content review" },
    );
  },
);
test.each([
  { type: "message", id },
  { type: "candle", id, reason: "Review" },
  { type: "message", id: { $ne: null }, reason: "Review" },
])("invalid requests cannot reach deletion", async (body) => {
  const res = response();
  await handler({ method: "DELETE", body }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(deleteCommunityContent).not.toHaveBeenCalled();
});
test("cross-origin deletion is rejected before authentication or deletion", async () => {
  const res = response();
  await handler(
    {
      method: "DELETE",
      headers: {
        origin: "https://untrusted.invalid",
        "sec-fetch-site": "cross-site",
      },
      body: { type: "message", id, reason: "Review" },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(403);
  expect(deleteCommunityContent).not.toHaveBeenCalled();
});
