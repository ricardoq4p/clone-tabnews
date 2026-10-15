jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/models/User", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn(), updateOne: jest.fn() },
}));
jest.mock("../lib/rate-limit", () => ({
  checkRateLimit: jest.fn(async () => ({ success: true })),
  createRateLimitErrorMessage: jest.fn(),
}));
jest.mock("../lib/verification-email", () => ({
  createVerification: () => ({
    token: "raw-token",
    fields: {
      verificationToken: "hashed-token",
      verificationTokenExpires: new Date("2030-01-01"),
    },
  }),
  sendVerificationEmail: jest.fn(),
}));
jest.mock("bcryptjs", () => ({ hash: jest.fn(async () => "hashed-password") }));
import User from "../lib/models/User";
import { sendVerificationEmail } from "../lib/verification-email";
import register from "../pages/api/users/register";
import reset from "../pages/api/users/reset-password";
const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  setHeader: jest.fn(),
});
beforeEach(() => {
  User.findOne.mockResolvedValue(null);
  User.create.mockImplementation(async (user) => user);
});
afterEach(() => {
  delete process.env.SUPERADMIN_EMAIL;
});
test("registration never self-provisions a superadmin or verified account", async () => {
  process.env.SUPERADMIN_EMAIL = "admin@example.com";
  const res = response();
  await register(
    {
      method: "POST",
      body: {
        email: "admin@example.com",
        password: "test-password",
        name: "Maria",
      },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(201);
  expect(User.create).toHaveBeenCalledWith(
    expect.objectContaining({
      role: "user",
      isVerified: false,
      verificationToken: "hashed-token",
    }),
  );
  expect(sendVerificationEmail).toHaveBeenCalled();
});
test("mail failure reports that the account exists and offers resend", async () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  sendVerificationEmail.mockRejectedValueOnce(new Error("smtp"));
  const res = response();
  await register(
    {
      method: "POST",
      body: {
        email: "maria@example.com",
        password: "test-password",
        name: "Maria",
      },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith({
    message: expect.stringContaining("reenvio"),
  });
  spy.mockRestore();
});
test("invalid password types never create a user", async () => {
  const res = response();
  await register(
    {
      method: "POST",
      body: {
        email: "maria@example.com",
        password: { value: "password" },
        name: "Maria",
      },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(400);
  expect(User.create).not.toHaveBeenCalled();
});
test("password reset uses compare-and-swap and revokes existing sessions", async () => {
  User.findOne.mockResolvedValue({ _id: "user-id" });
  User.updateOne.mockResolvedValue({ modifiedCount: 1 });
  const res = response();
  await reset(
    {
      method: "POST",
      body: { token: "reset-token", password: "new-password" },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(200);
  expect(User.updateOne).toHaveBeenCalledWith(
    expect.objectContaining({
      resetPasswordToken: expect.any(String),
      resetPasswordExpires: { $gt: expect.any(Date) },
    }),
    expect.objectContaining({ $inc: { sessionVersion: 1 } }),
  );
});
test("racing token reuse cannot report a successful password reset", async () => {
  User.findOne.mockResolvedValue({ _id: "user-id" });
  User.updateOne.mockResolvedValue({ modifiedCount: 0 });
  const res = response();
  await reset(
    {
      method: "POST",
      body: { token: "reset-token", password: "new-password" },
    },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(400);
});
