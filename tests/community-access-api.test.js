jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/models/Community", () => ({
  __esModule: true,
  default: { findById: jest.fn(), updateOne: jest.fn() },
}));
jest.mock("../lib/models/User", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findById: jest.fn() },
}));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
}));
jest.mock("../lib/pusher", () => ({
  getPusher: jest.fn(() => ({
    authorizeChannel: jest.fn(() => ({ auth: "signature" })),
  })),
}));
jest.mock("../lib/notifications", () => ({ tryCreateNotification: jest.fn() }));
jest.mock("../lib/notification-realtime", () => ({
  notifyNotificationChange: jest.fn(),
}));
import { getServerSession } from "next-auth";
import Community from "../lib/models/Community";
import User from "../lib/models/User";
import { tryCreateNotification } from "../lib/notifications";
import join from "../pages/api/communities/[id]/join";
import pusherAuth from "../pages/api/pusher/auth";
const id = "123456789012345678901234";
const outsider = "123456789012345678901235";
const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  setHeader: jest.fn(),
});
beforeEach(() => {
  getServerSession.mockResolvedValue({ user: { id: outsider } });
  Community.findById.mockResolvedValue({
    _id: id,
    privacy: "private",
    ownerId: id,
    members: [id],
  });
});
test("a non-member cannot self-admit to a private community", async () => {
  const res = response();
  await join({ method: "POST", query: { id }, body: { action: "join" } }, res);
  expect(res.status).toHaveBeenCalledWith(403);
  expect(Community.updateOne).not.toHaveBeenCalled();
});
test("a non-owner cannot approve their own membership", async () => {
  const res = response();
  await join(
    {
      method: "POST",
      query: { id },
      body: { action: "approve", userId: outsider },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(403);
  expect(Community.updateOne).not.toHaveBeenCalled();
});
test("Pusher refuses a non-member's private subscription", async () => {
  const res = response();
  await pusherAuth(
    {
      method: "POST",
      body: { channel_name: `private-community-${id}`, socket_id: "123.456" },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(403);
});
test("Pusher authorizes an existing member", async () => {
  getServerSession.mockResolvedValue({ user: { id } });
  const res = response();
  await pusherAuth(
    {
      method: "POST",
      body: { channel_name: `private-community-${id}`, socket_id: "123.456" },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({ auth: "signature" });
});
test("archived community cannot authorize a subscription", async () => {
  getServerSession.mockResolvedValue({ user: { id } });
  Community.findById.mockResolvedValue({
    privacy: "public",
    ownerId: id,
    members: [id],
    deletedAt: new Date(),
  });
  const res = response();
  await pusherAuth(
    {
      method: "POST",
      body: { channel_name: `private-community-${id}`, socket_id: "123.456" },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(403);
});

test("private community owner addition notifies the newly added member", async () => {
  const member = {
    _id: id,
    privacy: "private",
    ownerId: id,
    members: [id],
    populate: async () => member,
  };
  Community.findById.mockResolvedValue(member);
  User.findOne.mockReturnValue({ select: async () => ({ _id: outsider }) });
  getServerSession.mockResolvedValue({ user: { id } });
  const res = response();
  await join(
    {
      method: "POST",
      query: { id },
      body: { action: "approve", userId: outsider },
    },
    res,
  );
  expect(Community.updateOne).toHaveBeenCalled();
  expect(tryCreateNotification).toHaveBeenCalledWith({
    recipientId: outsider,
    actorId: id,
    type: "community_invite",
    targetId: id,
    dedupeKey: `community-invite:${id}:${outsider}`,
  });
});

test("a private user notification channel is restricted to its owner", async () => {
  getServerSession.mockResolvedValue({ user: { id: outsider } });
  const res = response();
  await pusherAuth(
    {
      method: "POST",
      body: { channel_name: `private-user-${id}`, socket_id: "123.456" },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(403);
  expect(User.findById).not.toHaveBeenCalled();
});

test("a user can authorize only their own private notification channel", async () => {
  getServerSession.mockResolvedValue({ user: { id } });
  User.findById.mockReturnValue({
    select: () => ({ lean: async () => ({ _id: id }) }),
  });
  const res = response();
  await pusherAuth(
    {
      method: "POST",
      body: { channel_name: `private-user-${id}`, socket_id: "123.456" },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({ auth: "signature" });
});
