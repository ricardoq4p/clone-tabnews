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
    findOne: jest.fn(),
    init: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));
jest.mock("../lib/models/User", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock("../lib/pusher", () => ({ notifyChange: jest.fn() }));
jest.mock("../lib/notifications", () => ({ tryCreateNotification: jest.fn() }));
jest.mock("../lib/notification-realtime", () => ({
  notifyNotificationChange: jest.fn(),
}));
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
import User from "../lib/models/User";
import { tryCreateNotification } from "../lib/notifications";
import handler from "../pages/api/comments";
const id = "123456789012345678901234";
const actor = "123456789012345678901235";
const owner = "123456789012345678901236";
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

test("a comment notifies the publication owner after the comment is saved", async () => {
  const comment = {
    _id: id,
    toObject: () => ({
      _id: id,
      content: "Amém",
      author: "Pessoa",
      userId: { name: "Pessoa", avatar: "" },
    }),
    populate: async () => comment,
  };
  getServerSession.mockResolvedValue({ user: { id: actor, name: "Pessoa" } });
  Message.findById.mockResolvedValue({
    _id: id,
    userId: owner,
    communityId: null,
  });
  User.findById.mockReturnValue({
    select: async () => ({ _id: actor, name: "Pessoa", avatar: "" }),
  });
  Comment.create.mockResolvedValue(comment);
  const res = response();
  await handler(
    { method: "POST", query: {}, body: { content: "Amém", messageId: id } },
    res,
  );
  expect(Comment.create).toHaveBeenCalled();
  expect(tryCreateNotification).toHaveBeenCalledWith({
    recipientId: owner,
    actorId: actor,
    type: "message_comment",
    targetId: id,
    dedupeKey: `message-comment:${id}`,
  });
});

test("comment request retries reuse one persisted comment and notification key", async () => {
  const comment = {
    _id: id,
    status: "published",
    toObject: () => ({
      _id: id,
      content: "Amém",
      author: "Pessoa",
      userId: { name: "Pessoa", avatar: "" },
    }),
    populate: async () => comment,
  };
  getServerSession.mockResolvedValue({ user: { id: actor, name: "Pessoa" } });
  Message.findById.mockResolvedValue({
    _id: id,
    userId: owner,
    communityId: null,
  });
  User.findById.mockReturnValue({
    select: async () => ({ _id: actor, name: "Pessoa", avatar: "" }),
  });
  Comment.findOne
    .mockReturnValueOnce({ populate: async () => null })
    .mockReturnValueOnce({ populate: async () => comment });
  Comment.create.mockResolvedValue(comment);
  const request = {
    method: "POST",
    query: {},
    headers: { "idempotency-key": "stable-comment-request-1" },
    body: { content: "Amém", messageId: id },
  };
  const firstResponse = response();
  await handler(request, firstResponse);
  const retryResponse = response();
  await handler(request, retryResponse);
  expect(firstResponse.status).toHaveBeenCalledWith(201);
  expect(retryResponse.status).toHaveBeenCalledWith(200);
  expect(Comment.create).toHaveBeenCalledTimes(1);
  expect(tryCreateNotification).toHaveBeenCalledTimes(2);
  expect(tryCreateNotification.mock.calls[0][0].dedupeKey).toBe(
    tryCreateNotification.mock.calls[1][0].dedupeKey,
  );
});
