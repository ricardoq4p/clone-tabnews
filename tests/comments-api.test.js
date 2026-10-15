jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/models/Message", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock("../lib/models/Community", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock("../lib/models/Comment", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));
jest.mock("../lib/models/User", () => ({ __esModule: true, default: {} }));
jest.mock("../lib/pusher", () => ({ notifyChange: jest.fn() }));
jest.mock("../lib/pantera-comments", () => ({
  maybeReplyAsPantera: jest.fn(),
}));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
}));
import { getServerSession } from "next-auth";
import Message from "../lib/models/Message";
import Community from "../lib/models/Community";
import Comment from "../lib/models/Comment";
import handler from "../pages/api/comments";
const id = "123456789012345678901234";
function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
}
beforeEach(() => {
  getServerSession.mockResolvedValue({ user: { id: "outsider" } });
  Message.findById.mockResolvedValue({ _id: id, communityId: id });
  Community.findById.mockResolvedValue({
    privacy: "private",
    members: [],
    ownerId: "owner",
  });
});
test.each(["GET", "POST"])(
  "%s cannot access a private thread",
  async (method) => {
    const res = response();
    await handler(
      {
        method,
        query: { messageId: id },
        body: { content: "Ola", messageId: id },
      },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(Comment.find).not.toHaveBeenCalled();
    expect(Comment.create).not.toHaveBeenCalled();
  },
);
test("orphaned publication does not expose its comments", async () => {
  Community.findById.mockResolvedValue(null);
  const res = response();
  await handler({ method: "GET", query: { messageId: id } }, res);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(Comment.find).not.toHaveBeenCalled();
});
test("member can read private comments", async () => {
  getServerSession.mockResolvedValue({ user: { id: "owner" } });
  Comment.find.mockReturnValue({
    populate: () => ({ sort: () => ({ limit: async () => [] }) }),
  });
  const res = response();
  await handler({ method: "GET", query: { messageId: id } }, res);
  expect(res.status).toHaveBeenCalledWith(200);
});
test("legacy author name cannot authorize deletion", async () => {
  getServerSession.mockResolvedValue({
    user: { id: "outsider", name: "Maria" },
  });
  Comment.findById.mockResolvedValue({ author: "Maria" });
  const res = response();
  await handler({ method: "DELETE", query: { id } }, res);
  expect(res.status).toHaveBeenCalledWith(403);
  expect(Comment.findByIdAndDelete).not.toHaveBeenCalled();
});
test("invalid identifiers never reach MongoDB queries", async () => {
  const res = response();
  await handler({ method: "GET", query: { messageId: { $ne: null } } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(Message.findById).not.toHaveBeenCalled();
});
