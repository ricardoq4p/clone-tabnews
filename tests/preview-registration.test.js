import {
  isPreviewRegistrationEnabled,
  previewVerificationUrl,
  isPreviewTestEmail,
} from "@/lib/preview-registration";
const env = {
  PANTERALAB_PREVIEW_REGISTRATION: "true",
  VERCEL: "1",
  VERCEL_ENV: "preview",
  VERCEL_PROJECT_ID: "prj_ZdM6aXzCNoJPZURVCGHj1KTbRIUe",
  EMAIL_DELIVERY_DISABLED: "true",
  NEXTAUTH_URL: "https://panteralab-homologacao-fixture.vercel.app",
  MONGODB_URI:
    "mongodb+srv://fixture:fixture@testcluster.mongodb.net/panteralab_homologacao_vercel?tls=true",
  PANTERALAB_PREVIEW_MONGODB_HOST: "testcluster.mongodb.net",
};
test("protected preview can confirm only fictitious test addresses", () => {
  expect(isPreviewRegistrationEnabled(env)).toBe(true);
  expect(
    previewVerificationUrl("ana@panteralab.test", "a".repeat(64), env),
  ).toBe(
    "https://panteralab-homologacao-fixture.vercel.app/verify?token=" +
      "a".repeat(64),
  );
  expect(
    previewVerificationUrl("real@example.com", "a".repeat(64), env),
  ).toBeNull();
  expect(isPreviewTestEmail("a@panteralab.test.attacker.com")).toBe(false);
});
test.each([
  { VERCEL_ENV: "production" },
  { VERCEL_PROJECT_ID: "prj_FRcbozdufCmWfO6FNmFLtyYwKT1S" },
  { PANTERALAB_PREVIEW_REGISTRATION: "false" },
  { EMAIL_DELIVERY_DISABLED: "false" },
  { NEXTAUTH_URL: "https://panteralab.com.br" },
  {
    MONGODB_URI:
      "mongodb+srv://fixture:fixture@testcluster.mongodb.net/production",
  },
  {
    MONGODB_URI:
      "mongodb+srv://fixture:fixture@other.mongodb.net/panteralab_homologacao_vercel",
  },
  { MONGODB_URI: env.MONGODB_URI + "&tls=false" },
])(
  "test confirmation is blocked outside its verified boundary %j",
  (override) => {
    expect(
      previewVerificationUrl("ana@panteralab.test", "a".repeat(64), {
        ...env,
        ...override,
      }),
    ).toBeNull();
  },
);
