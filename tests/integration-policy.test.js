import {
  serverIntegrationEnabled,
  isProductionTestAccount,
} from "../lib/integration-policy";
import { isPreviewRegistrationEnabled } from "../lib/preview-registration";
test.each(["email", "ai", "realtime", "uploads"])(
  "production %s stays off despite old credentials",
  (kind) => {
    expect(
      serverIntegrationEnabled(kind, {
        VERCEL_ENV: "production",
        BREVO_KEY: "old",
        OPENAI_API_KEY: "old",
        PUSHER_SECRET: "old",
      }),
    ).toBe(false);
  },
);
test.each([
  ["email", "PANTERALAB_EMAIL_ENABLED"],
  ["ai", "PANTERALAB_AI_ENABLED"],
  ["realtime", "NEXT_PUBLIC_REALTIME_ENABLED"],
  ["uploads", "NEXT_PUBLIC_UPLOADS_ENABLED"],
])("%s needs a specific opt-in", (kind, flag) => {
  expect(
    serverIntegrationEnabled(kind, {
      VERCEL_ENV: "production",
      [flag]: "true",
    }),
  ).toBe(true);
  expect(
    serverIntegrationEnabled(kind, {
      VERCEL_ENV: "production",
      [flag]: "false",
    }),
  ).toBe(false);
});
test("the email kill switch overrides an enabled production provider", () => {
  expect(
    serverIntegrationEnabled("email", {
      VERCEL_ENV: "production",
      PANTERALAB_EMAIL_ENABLED: "true",
      EMAIL_DELIVERY_DISABLED: "true",
    }),
  ).toBe(false);
});
test("test identities cannot enter production even if provisioned by mistake", () => {
  expect(
    isProductionTestAccount("ANA@PANTERALAB.TEST", {
      VERCEL_ENV: "production",
    }),
  ).toBe(true);
  expect(
    isProductionTestAccount("ana@example.com", { VERCEL_ENV: "production" }),
  ).toBe(false);
  expect(
    isProductionTestAccount("ana@panteralab.test", { VERCEL_ENV: "preview" }),
  ).toBe(false);
  expect(
    isPreviewRegistrationEnabled({
      VERCEL_ENV: "production",
      PANTERALAB_PREVIEW_REGISTRATION: "true",
    }),
  ).toBe(false);
});
