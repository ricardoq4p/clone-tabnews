jest.mock("../lib/models/Notification", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    updateOne: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    updateMany: jest.fn(),
  },
}));
jest.mock("../lib/models/User", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock("../lib/models/Candle", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock("../lib/models/Message", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock("../lib/models/Community", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
}));
jest.mock("../lib/prayer-support", () => ({
  supportSummary: jest.fn(async () => new Map()),
}));

import mongoose from "mongoose";
import Notification from "../lib/models/Notification";
import { getServerSession } from "next-auth";
import {
  createNotification,
  notificationCommentId,
  notificationHref,
  parseNotificationTarget,
  resolveNotificationTarget,
  tryCreateNotification,
} from "../lib/notifications";
import list from "../pages/api/notifications";
import unreadCount from "../pages/api/notifications/unread-count";
import markRead from "../pages/api/notifications/[id]";
import readAll from "../pages/api/notifications/read-all";
import messagesHandler from "../pages/api/messages";

const user = "123456789012345678901234";
const actor = "123456789012345678901235";
const target = "123456789012345678901236";
const commentId = "6ae38dedadddb7798cf89b20";
const communityId = "6ad28606605a619d0a8c1907";
const res = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  setHeader: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.MONGODB_URI = "mongodb://127.0.0.1/notification-test";
  getServerSession.mockResolvedValue({ user: { id: user } });
});
afterEach(() => delete process.env.MONGODB_URI);

test("notification creation is recipient scoped and idempotent", async () => {
  Notification.updateOne.mockResolvedValue({ upsertedCount: 1 });
  await createNotification({
    recipientId: user,
    actorId: actor,
    type: "message_comment",
    targetId: target,
    dedupeKey: "comment:1",
  });
  expect(Notification.updateOne).toHaveBeenCalledWith(
    { recipientId: user, dedupeKey: "comment:1" },
    {
      $setOnInsert: expect.objectContaining({
        recipientId: user,
        actorId: actor,
        targetId: target,
        type: "message_comment",
      }),
    },
    { upsert: true },
  );
});

test("self notifications and malformed recipient data are ignored", async () => {
  expect(
    await createNotification({
      recipientId: user,
      actorId: user,
      type: "message_comment",
      targetId: target,
      dedupeKey: "x",
    }),
  ).toBe(false);
  expect(
    await createNotification({
      recipientId: "not-an-id",
      actorId: actor,
      type: "message_comment",
      targetId: target,
      dedupeKey: "x",
    }),
  ).toBe(false);
  expect(Notification.updateOne).not.toHaveBeenCalled();
});

test("community message notifications link inside their community", () => {
  const communityId = "123456789012345678901237";
  expect(
    notificationHref({
      type: "message_comment",
      targetType: "message",
      targetId: target,
      communityId,
    }),
  ).toBe(`/comunidades/${communityId}?message=${target}#message-${target}`);
});

test("notification storage failure is converted to a best-effort result", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  Notification.updateOne.mockRejectedValue(new Error("database unavailable"));
  await expect(
    tryCreateNotification({
      recipientId: user,
      actorId: actor,
      type: "message_comment",
      targetId: target,
      dedupeKey: "comment:failure",
    }),
  ).resolves.toBe(false);
  log.mockRestore();
});

test("unread count always uses the authenticated recipient", async () => {
  Notification.countDocuments.mockResolvedValue(3);
  const response = res();
  await unreadCount({ method: "GET", query: { userId: actor } }, response);
  expect(Notification.countDocuments).toHaveBeenCalledWith({
    recipientId: user,
    readAt: null,
  });
  expect(response.json).toHaveBeenCalledWith({ count: 3 });
});

test("notification listing is paginated, scoped, and omits inaccessible targets", async () => {
  const privateNotification = {
    _id: new mongoose.Types.ObjectId(),
    type: "message_prayer",
    targetType: "message",
    targetId: target,
    actorId: { name: "Pessoa" },
    readAt: null,
    createdAt: new Date(),
  };
  Notification.find.mockReturnValue({
    sort: () => ({
      limit: () => ({
        populate: () => ({ lean: async () => [privateNotification] }),
      }),
    }),
  });
  const { default: Message } = await import("../lib/models/Message");
  const { default: Community } = await import("../lib/models/Community");
  Message.findById.mockReturnValue({
    lean: async () => ({
      _id: target,
      communityId: "123456789012345678901237",
      status: "published",
    }),
  });
  Community.findById.mockReturnValue({
    lean: async () => ({
      _id: "123456789012345678901237",
      privacy: "private",
      ownerId: actor,
      members: [actor],
      deletedAt: null,
    }),
  });
  const response = res();
  await list({ method: "GET", query: { userId: actor, limit: "2" } }, response);
  expect(Notification.find).toHaveBeenCalledWith({ recipientId: user });
  expect(response.json).toHaveBeenCalledWith({ items: [], next: null });
});

test("accessible notification links to its publication", async () => {
  const notificationId = new mongoose.Types.ObjectId();
  Notification.find.mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: async () => [
            {
              _id: notificationId,
              type: "message_comment",
              targetType: "message",
              targetId: target,
              actorId: { name: "Ana" },
              readAt: null,
              createdAt: new Date(),
            },
          ],
        }),
      }),
    }),
  });
  const { default: Message } = await import("../lib/models/Message");
  Message.findById.mockReturnValue({
    lean: async () => ({ _id: target, status: "published", communityId: null }),
  });
  const response = res();
  await list({ method: "GET", query: { limit: "1" } }, response);
  const payload = response.json.mock.calls[0][0];
  expect(payload.items[0]).toEqual(
    expect.objectContaining({
      actorName: "Ana",
      href: `/feed?message=${target}#message-${target}`,
    }),
  );
});

test("anonymous callers cannot read notification counts", async () => {
  getServerSession.mockResolvedValueOnce(null);
  const response = res();
  await unreadCount({ method: "GET", query: {} }, response);
  expect(response.status).toHaveBeenCalledWith(401);
  expect(Notification.countDocuments).not.toHaveBeenCalled();
});

test("marking one notification read is owner-scoped", async () => {
  Notification.updateOne.mockResolvedValue({ matchedCount: 1 });
  const response = res();
  await markRead({ method: "PATCH", query: { id: target } }, response);
  expect(Notification.updateOne).toHaveBeenCalledWith(
    { _id: target, recipientId: user, readAt: null },
    { $set: { readAt: expect.any(Date) } },
  );
});

test("mark all read only updates the authenticated user's unread records", async () => {
  Notification.updateMany.mockResolvedValue({ modifiedCount: 2 });
  const response = res();
  await readAll({ method: "PATCH", query: {} }, response);
  expect(Notification.updateMany).toHaveBeenCalledWith(
    { recipientId: user, readAt: null },
    { $set: { readAt: expect.any(Date) } },
  );
  expect(response.json).toHaveBeenCalledWith({ success: true, updated: 2 });
});

test("feed and community comment notifications include commentId and anchor in destination href", () => {
  expect(
    notificationHref({
      type: "message_comment",
      targetType: "message",
      targetId: target,
      commentId,
      communityId: null,
    }),
  ).toBe(`/feed?message=${target}&comment=${commentId}#comment-${commentId}`);

  expect(
    notificationHref({
      type: "message_comment",
      targetType: "message",
      targetId: target,
      commentId,
      communityId,
    }),
  ).toBe(
    `/comunidades/${communityId}?message=${target}&comment=${commentId}#comment-${commentId}`,
  );
});

test("legacy message_comment notifications derive commentId from dedupeKey without migration", () => {
  const legacyNotification = {
    type: "message_comment",
    targetType: "message",
    targetId: target,
    dedupeKey: `message-comment:${commentId}`,
  };
  expect(notificationCommentId(legacyNotification)).toBe(commentId);
  expect(
    notificationHref({
      ...legacyNotification,
      communityId,
    }),
  ).toBe(
    `/comunidades/${communityId}?message=${target}&comment=${commentId}#comment-${commentId}`,
  );
});

test("other notification types preserve their respective routes and destinations", () => {
  const candleId = "6ad28606605a619d0a8c1909";
  expect(
    notificationHref({
      type: "candle_prayer",
      targetType: "candle",
      targetId: candleId,
    }),
  ).toBe(`/minhas-velas?candle=${candleId}`);

  expect(
    notificationHref({
      type: "message_prayer",
      targetType: "message",
      targetId: target,
      communityId: null,
    }),
  ).toBe(`/feed?message=${target}#message-${target}`);

  expect(
    notificationHref({
      type: "message_prayer",
      targetType: "message",
      targetId: target,
      communityId,
    }),
  ).toBe(`/comunidades/${communityId}?message=${target}#message-${target}`);

  expect(
    notificationHref({
      type: "community_invite",
      targetType: "community",
      targetId: communityId,
    }),
  ).toBe(`/comunidades/${communityId}`);
});

test("GET /api/notifications returns commentId and comment-targeted href for comment notifications", async () => {
  const notificationId = new mongoose.Types.ObjectId();
  Notification.find.mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: async () => [
            {
              _id: notificationId,
              type: "message_comment",
              targetType: "message",
              targetId: target,
              commentId,
              dedupeKey: `message-comment:${commentId}`,
              actorId: { name: "Agente de IA baiano" },
              readAt: null,
              createdAt: new Date(),
            },
          ],
        }),
      }),
    }),
  });
  const { default: Message } = await import("../lib/models/Message");
  Message.findById.mockReturnValue({
    lean: async () => ({
      _id: target,
      status: "published",
      communityId: null,
    }),
  });
  const response = res();
  await list({ method: "GET", query: { limit: "1" } }, response);
  const payload = response.json.mock.calls[0][0];
  expect(payload.items[0]).toEqual(
    expect.objectContaining({
      actorName: "Agente de IA baiano",
      targetId: target,
      commentId,
      href: `/feed?message=${target}&comment=${commentId}#comment-${commentId}`,
    }),
  );
  expect(payload.items[0].targetId).not.toBe(payload.items[0].commentId);
});

test("resolveNotificationTarget supports both router query and direct URL search/hash without confusing messageId and commentId", () => {
  const fromQuery = resolveNotificationTarget(
    { message: target, comment: commentId },
    "",
    `#comment-${commentId}`,
  );
  expect(fromQuery).toEqual({
    messageId: target,
    commentId,
    hasInvalidMessageParam: false,
    hasInvalidCommentParam: false,
  });

  const fromDirectUrl = resolveNotificationTarget(
    {},
    `?message=${target}&comment=${commentId}`,
    `#comment-${commentId}`,
  );
  expect(fromDirectUrl).toEqual({
    messageId: target,
    commentId,
    hasInvalidMessageParam: false,
    hasInvalidCommentParam: false,
  });

  const fromHashOnly = parseNotificationTarget({}, `#message-${target}`);
  expect(fromHashOnly).toEqual({
    messageId: target,
    commentId: "",
    hasInvalidMessageParam: false,
    hasInvalidCommentParam: false,
  });

  const invalidParams = resolveNotificationTarget(
    { message: "invalid-msg", comment: "invalid-comment" },
    "",
    "",
  );
  expect(invalidParams).toEqual({
    messageId: "",
    commentId: "",
    hasInvalidMessageParam: true,
    hasInvalidCommentParam: true,
  });
});

test("GET /api/messages?id=... loads a single accessible feed or community publication and enforces privacy", async () => {
  const { default: Message } = await import("../lib/models/Message");
  const { default: Community } = await import("../lib/models/Community");

  const populatedMsg = {
    _id: target,
    content: "Partilha de oração original",
    category: "prayer",
    status: "published",
    communityId: null,
    userId: { _id: user, name: "sumo", avatar: "" },
    prayedBy: [],
    supportCount: 0,
    createdAt: new Date(),
    toObject() {
      return { ...this };
    },
  };
  Message.findById.mockResolvedValueOnce({
    ...populatedMsg,
    populate: async () => populatedMsg,
  });

  const okRes = res();
  await messagesHandler({ method: "GET", query: { id: target } }, okRes);
  expect(okRes.status).toHaveBeenCalledWith(200);
  expect(okRes.json).toHaveBeenCalledWith([
    expect.objectContaining({
      _id: target,
      content: "Partilha de oração original",
      author: "sumo",
    }),
  ]);

  // Private community post for non-member returns 404
  Message.findById.mockResolvedValueOnce({
    _id: target,
    status: "published",
    communityId,
  });
  Community.findById.mockResolvedValueOnce({
    _id: communityId,
    privacy: "private",
    ownerId: actor,
    members: [actor],
    deletedAt: null,
  });
  const privateRes = res();
  await messagesHandler({ method: "GET", query: { id: target } }, privateRes);
  expect(privateRes.status).toHaveBeenCalledWith(404);

  // Deleted/missing message returns 404
  Message.findById.mockResolvedValueOnce(null);
  const missingRes = res();
  await messagesHandler({ method: "GET", query: { id: target } }, missingRes);
  expect(missingRes.status).toHaveBeenCalledWith(404);

  // Invalid id returns 400
  const invalidRes = res();
  await messagesHandler(
    { method: "GET", query: { id: "not-an-id" } },
    invalidRes,
  );
  expect(invalidRes.status).toHaveBeenCalledWith(400);
});
