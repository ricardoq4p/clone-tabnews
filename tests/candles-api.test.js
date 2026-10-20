jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
}));
jest.mock("../lib/models/Candle", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock("../lib/models/User", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock("../lib/prayer-support", () => ({
  supportSummary: jest.fn(async () => new Map()),
  recordPrayer: jest.fn(async () => ({ prayed: true, supportCount: 1 })),
}));
jest.mock("../lib/notifications", () => ({ tryCreateNotification: jest.fn() }));
jest.mock("../lib/notification-realtime", () => ({
  notifyNotificationChange: jest.fn(),
}));
import { getServerSession } from "next-auth";
import Candle from "../lib/models/Candle";
import User from "../lib/models/User";
import { recordPrayer, supportSummary } from "../lib/prayer-support";
import { tryCreateNotification } from "../lib/notifications";
import candles from "../pages/api/velas";
import detail from "../pages/api/velas/[id]";
import pray from "../pages/api/velas/[id]/oracao";
import mine from "../pages/api/velas/minhas";
const id = "123456789012345678901234",
  owner = "123456789012345678901235",
  outsider = "123456789012345678901236";
const res = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  setHeader: jest.fn(),
});
const now = new Date("2026-10-15T18:00:00Z");
beforeEach(() => {
  jest.clearAllMocks();
  process.env.MONGODB_URI = "mongodb://127.0.0.1/isolated-test-never-connected";
  jest.useFakeTimers().setSystemTime(now);
  getServerSession.mockResolvedValue({ user: { id: owner } });
  User.findById.mockReturnValue({
    select: () => ({ lean: async () => ({ name: "Maria" }) }),
  });
  Candle.create.mockImplementation(async (value) => ({
    ...value,
    _id: id,
    status: "active",
  }));
});
afterEach(() => {
  jest.useRealTimers();
  delete process.env.MONGODB_URI;
});
test("creation ignores injected owner, timestamps, role and expiry", async () => {
  const response = res();
  await candles(
    {
      method: "POST",
      body: {
        accountId: owner,
        intention: "Pela paz",
        visibility: "private",
        privacyAccepted: true,
        ownerId: outsider,
        expiresAt: "2099-01-01",
        createdAt: "2000-01-01",
        role: "superadmin",
      },
      query: {},
    },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(201);
  expect(Candle.create).toHaveBeenCalledWith(
    expect.objectContaining({
      ownerId: owner,
      createdAt: now,
      expiresAt: new Date("2026-10-22T18:00:00Z"),
      policyVersion: "2026-2",
    }),
  );
  expect(Candle.create.mock.calls[0][0].role).toBeUndefined();
});
test("anonymous visitors cannot create candles", async () => {
  getServerSession.mockResolvedValue(null);
  const response = res();
  await candles({ method: "POST", body: {}, query: {} }, response);
  expect(response.status).toHaveBeenCalledWith(401);
  expect(Candle.create).not.toHaveBeenCalled();
});
test("explicit privacy acknowledgement is required", async () => {
  const response = res();
  await candles(
    {
      method: "POST",
      body: { accountId: owner, intention: "Pela paz", visibility: "public" },
      query: {},
    },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(400);
  expect(Candle.create).not.toHaveBeenCalled();
});
test.each(["GET", "PATCH"])(
  "%s cannot access another user's private candle",
  async (method) => {
    Candle.findById.mockReturnValue({
      lean: async () => ({
        _id: id,
        ownerId: outsider,
        visibility: "private",
        status: "active",
        expiresAt: new Date("2026-10-22"),
      }),
    });
    const response = res();
    await detail(
      {
        method,
        query: { id },
        body: { action: "privacy", visibility: "public" },
      },
      response,
    );
    expect(response.status).toHaveBeenCalledWith(404);
    expect(Candle.findOneAndUpdate).not.toHaveBeenCalled();
  },
);
test("an expired intention cannot collect more prayer registrations", async () => {
  Candle.findById.mockReturnValue({
    lean: async () => ({
      _id: id,
      ownerId: owner,
      visibility: "public",
      status: "active",
      expiresAt: now,
    }),
  });
  const response = res();
  await pray({ method: "PUT", query: { id }, body: {} }, response);
  expect(response.status).toHaveBeenCalledWith(404);
  expect(recordPrayer).not.toHaveBeenCalled();
});
test("a new prayer on another user's public candle notifies its owner once", async () => {
  getServerSession.mockResolvedValue({ user: { id: outsider } });
  Candle.findById.mockReturnValue({
    lean: async () => ({
      _id: id,
      ownerId: owner,
      visibility: "public",
      status: "active",
      expiresAt: new Date("2026-10-22T18:00:00Z"),
    }),
  });
  recordPrayer.mockResolvedValueOnce({
    prayed: true,
    created: true,
    supportCount: 1,
  });
  const response = res();
  await pray({ method: "PUT", query: { id }, body: {} }, response);
  expect(tryCreateNotification).toHaveBeenCalledWith({
    recipientId: owner,
    actorId: outsider,
    type: "candle_prayer",
    targetId: id,
    dedupeKey: `candle-prayer:${id}:${outsider}`,
  });
});

test("a duplicate prayer does not create another notification", async () => {
  getServerSession.mockResolvedValue({ user: { id: outsider } });
  Candle.findById.mockReturnValue({
    lean: async () => ({
      _id: id,
      ownerId: owner,
      visibility: "public",
      status: "active",
      expiresAt: new Date("2026-10-22T18:00:00Z"),
    }),
  });
  recordPrayer.mockResolvedValueOnce({
    prayed: true,
    created: false,
    supportCount: 1,
  });
  const response = res();
  await pray({ method: "PUT", query: { id }, body: {} }, response);
  expect(tryCreateNotification).not.toHaveBeenCalled();
});
test("public list always filters expiry and privacy in MongoDB", async () => {
  Candle.find.mockReturnValue({
    sort: () => ({ limit: () => ({ lean: async () => [] }) }),
  });
  const response = res();
  await candles({ method: "GET", query: {} }, response);
  expect(Candle.find).toHaveBeenCalledWith(
    expect.objectContaining({
      expiresAt: { $gt: now },
      visibility: { $in: ["public", "anonymous"] },
      status: "active",
    }),
  );
  expect(response.setHeader).toHaveBeenCalledWith(
    "Cache-Control",
    "private, no-store",
  );
});

test("a candle notification deep link only loads the authenticated owner's candle", async () => {
  Candle.findOne.mockReturnValue({
    lean: async () => ({
      _id: id,
      ownerId: owner,
      visibility: "public",
      status: "active",
      authorName: "Maria",
      intention: "Pela paz",
      createdAt: now,
      expiresAt: new Date("2026-10-22T18:00:00Z"),
    }),
  });
  const response = res();
  await mine({ method: "GET", query: { id } }, response);
  expect(Candle.findOne).toHaveBeenCalledWith({ _id: id, ownerId: owner });
  expect(response.status).toHaveBeenCalledWith(200);
  expect(response.json.mock.calls[0][0].items).toHaveLength(1);
});

test("a queued creation cannot move an intention to a different signed-in account", async () => {
  const response = res();
  await candles(
    {
      method: "POST",
      query: {},
      body: {
        accountId: outsider,
        intention: "Intenção reservada",
        visibility: "private",
        privacyAccepted: true,
      },
    },
    response,
  );
  expect(response.status).toHaveBeenCalledWith(401);
  expect(Candle.create).not.toHaveBeenCalled();
});

test("a candle expiring during the database read is removed before serialization", async () => {
  Candle.find.mockReturnValue({
    sort: () => ({
      limit: () => ({
        lean: async () => [
          {
            _id: id,
            status: "active",
            visibility: "public",
            expiresAt: new Date(now.getTime() + 1000),
            authorName: "Maria",
            intention: "Não expor após vencer",
          },
        ],
      }),
    }),
  });
  supportSummary.mockImplementationOnce(async () => {
    jest.setSystemTime(new Date(now.getTime() + 1000));
    return new Map();
  });
  const response = res();
  await candles({ method: "GET", query: {} }, response);
  expect(response.json).toHaveBeenCalledWith(
    expect.objectContaining({ items: [] }),
  );
});
