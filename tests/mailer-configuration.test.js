jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn(() => ({ sendMail: jest.fn() })) },
}));
import nodemailer from "nodemailer";
import { createBrevoTransport } from "@/lib/mailer";
const names = [
  "EMAIL_DELIVERY_DISABLED",
  "BREVO_USER",
  "BREVO_KEY",
  "EMAIL_FROM",
  "PANTERALAB_LOCAL_SMTP",
  "PANTERALAB_HOMOLOGATION",
  "NEXTAUTH_URL",
  "MONGODB_URI",
  "VERCEL",
];
let previous;
beforeEach(() => {
  previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  for (const name of names) delete process.env[name];
});
afterEach(() => {
  for (const name of names) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
});
test("disabled email never creates a transport, even when credentials exist", () => {
  Object.assign(process.env, {
    EMAIL_DELIVERY_DISABLED: "true",
    BREVO_USER: "fixture",
    BREVO_KEY: "fixture",
    EMAIL_FROM: "test@example.test",
  });
  expect(() => createBrevoTransport()).toThrow(/desativado/);
  expect(nodemailer.createTransport).not.toHaveBeenCalled();
});
test("missing test credentials fail before opening an SMTP connection", () => {
  expect(() => createBrevoTransport()).toThrow(/indisponível/);
  expect(nodemailer.createTransport).not.toHaveBeenCalled();
});
test("configured Brevo transport keeps the existing provider", () => {
  Object.assign(process.env, {
    BREVO_USER: "fixture-user",
    BREVO_KEY: "fixture-password",
    EMAIL_FROM: "test@example.test",
  });
  createBrevoTransport();
  expect(nodemailer.createTransport).toHaveBeenCalledWith(
    expect.objectContaining({
      host: "smtp-relay.brevo.com",
      auth: { user: "fixture-user", pass: "fixture-password" },
    }),
  );
});
test("isolated local SMTP still works without any Brevo credentials", () => {
  Object.assign(process.env, {
    PANTERALAB_LOCAL_SMTP: "true",
    PANTERALAB_HOMOLOGATION: "local",
    NEXTAUTH_URL: "http://localhost:3107",
    MONGODB_URI:
      "mongodb://fixture:fixture@127.0.0.1:27027/panteralab_homologacao",
  });
  createBrevoTransport();
  expect(nodemailer.createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ host: "127.0.0.1", port: 1025 }),
  );
});
