jest.mock("next-auth", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: (config) => config,
}));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/models/User", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findById: jest.fn() },
}));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
}));
jest.mock("bcryptjs", () => ({ compare: jest.fn() }));
import User from "../lib/models/User";
import { compare } from "bcryptjs";
import { authOptions } from "../pages/api/auth/[...nextauth]";
const authorize = authOptions.providers[0].authorize;
afterEach(() => {
  delete process.env.SUPERADMIN_EMAIL;
});
test("wrong password cannot modify a privileged account", async () => {
  const user = {
    _id: "id",
    email: "admin@example.com",
    role: "superadmin",
    isVerified: false,
    save: jest.fn(),
  };
  User.findOne.mockResolvedValue(user);
  compare.mockResolvedValue(false);
  process.env.SUPERADMIN_EMAIL = user.email;
  await expect(
    authorize({ email: user.email, password: "wrong" }, {}),
  ).rejects.toThrow();
  expect(user.save).not.toHaveBeenCalled();
  expect(user.isVerified).toBe(false);
});
test("email configuration alone never grants privilege on login", async () => {
  const user = {
    _id: "id",
    email: "admin@example.com",
    role: "user",
    isVerified: true,
    save: jest.fn(),
  };
  User.findOne.mockResolvedValue(user);
  compare.mockResolvedValue(true);
  process.env.SUPERADMIN_EMAIL = user.email;
  const result = await authorize(
    { email: user.email, password: "correct" },
    {},
  );
  expect(result.role).toBe("user");
});
test("JWT refresh reads current role instead of trusting stale admin claims", async () => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ isVerified: true, role: "user" }),
  });
  const token = await authOptions.callbacks.jwt({
    token: { id: "id", role: "superadmin" },
  });
  expect(token.valid).toBe(true);
  expect(token.role).toBe("user");
});
test("password reset version invalidates an existing JWT", async () => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      isVerified: true,
      role: "superadmin",
      sessionVersion: 1,
    }),
  });
  const token = await authOptions.callbacks.jwt({
    token: { id: "id", sessionVersion: 0 },
  });
  expect(
    await authOptions.callbacks.session({ session: { user: {} }, token }),
  ).toEqual({});
});

test("revoked session has a JSON-safe payload without personal data", async () => {
  const result = await authOptions.callbacks.session({
    session: {
      user: {
        email: "private@example.test",
        name: "Private",
        role: "superadmin",
      },
    },
    token: { valid: false },
  });
  expect(JSON.stringify(result)).toBe("{}");
});

test("homologation identity cannot login on production", async () => {
  const old = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    await expect(
      authorize(
        { email: "ana@panteralab.test", password: "test-password" },
        {},
      ),
    ).rejects.toThrow();
    expect(User.findOne).not.toHaveBeenCalled();
    expect(compare).not.toHaveBeenCalled();
  } finally {
    if (old === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = old;
  }
});
