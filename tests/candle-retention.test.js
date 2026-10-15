import {
  expiredRetentionFilter,
  retentionAuthorized,
} from "../lib/candle-retention";
import handler from "../pages/api/internal/retention";
import connectToDatabase from "../lib/db";
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
const env = {
  PANTERALAB_RETENTION_ENABLED: "true",
  VERCEL_ENV: "production",
  VERCEL_PROJECT_ID: "prj_FRcbozdufCmWfO6FNmFLtyYwKT1bRIUe",
  CRON_SECRET: "a".repeat(48),
};
const headers = { authorization: "Bearer " + env.CRON_SECRET };
test("retention never targets old privacy versions or candles within their 90-day history", () => {
  const now = new Date("2027-02-01T00:00:00Z"),
    filter = expiredRetentionFilter(now);
  expect(filter.policyVersion).toBe("2026-2");
  expect(now - filter.expiresAt.$lte).toBe(90 * 86400000);
});
test("retention requires all project, production, enabled and bearer constraints", () => {
  const correct = {
    ...env,
    VERCEL_PROJECT_ID: "prj_FRcbozdufCmWfO6FNmFLtyYwKT1S",
  };
  expect(retentionAuthorized({ headers }, correct)).toBe(true);
  for (const override of [
    { VERCEL_ENV: "preview" },
    { VERCEL_PROJECT_ID: "other" },
    { PANTERALAB_RETENTION_ENABLED: "false" },
    { CRON_SECRET: "short" },
  ])
    expect(retentionAuthorized({ headers }, { ...correct, ...override })).toBe(
      false,
    );
  expect(
    retentionAuthorized(
      { headers: { authorization: "Bearer wrong" } },
      correct,
    ),
  ).toBe(false);
});
test("default endpoint rejects execution before any database access", async () => {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  await handler({ method: "GET", headers: {} }, res);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(connectToDatabase).not.toHaveBeenCalled();
});

test("authorized retention deletes only eligible candles and their exclusive auxiliaries, in a transaction", async () => {
  const names = [],
    calls = [];
  const id = "eligible-candle";
  const session = {
    withTransaction: jest.fn(async (fn) => fn()),
    endSession: jest.fn(),
  };
  const collection = (name) => {
    names.push(name);
    return {
      find: jest.fn(() => ({
        limit: () => ({ toArray: async () => [{ _id: id }] }),
      })),
      deleteMany: jest.fn(async (filter, options) => {
        calls.push({ name, filter, session: options.session });
        return { deletedCount: 1 };
      }),
      countDocuments: jest.fn(async () => 0),
    };
  };
  connectToDatabase.mockResolvedValue({
    connection: { db: { databaseName: "tabnews", collection } },
    startSession: async () => session,
  });
  const saved = { ...process.env };
  Object.assign(process.env, {
    PANTERALAB_RETENTION_ENABLED: "true",
    VERCEL_ENV: "production",
    VERCEL_PROJECT_ID: "prj_FRcbozdufCmWfO6FNmFLtyYwKT1S",
    CRON_SECRET: "z".repeat(48),
  });
  try {
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await handler(
      {
        method: "GET",
        headers: { authorization: "Bearer " + process.env.CRON_SECRET },
      },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(
      names.every((n) =>
        ["candles", "prayersupports", "abusereports"].includes(n),
      ),
    ).toBe(true);
    expect(calls).toHaveLength(3);
    expect(
      calls
        .filter((c) => c.name !== "candles")
        .every(
          (c) =>
            c.filter.targetType === "candle" && c.filter.targetId.$in[0] === id,
        ),
    ).toBe(true);
    expect(calls.find((c) => c.name === "candles").filter).toMatchObject({
      policyVersion: "2026-2",
      _id: { $in: [id] },
    });
    expect(calls.every((c) => c.session === session)).toBe(true);
    expect(session.endSession).toHaveBeenCalled();
  } finally {
    for (const name of [
      "PANTERALAB_RETENTION_ENABLED",
      "VERCEL_ENV",
      "VERCEL_PROJECT_ID",
      "CRON_SECRET",
    ]) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  }
});
