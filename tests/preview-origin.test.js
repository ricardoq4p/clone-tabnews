import { configurePreviewOrigin } from "@/lib/preview-origin";
const preview = {
  VERCEL: "1",
  VERCEL_ENV: "preview",
  VERCEL_PROJECT_ID: "prj_ZdM6aXzCNoJPZURVCGHj1KTbRIUe",
  VERCEL_URL: "panteralab-homologacao-fixture.vercel.app",
};
test("isolated preview uses its exact platform-assigned HTTPS origin", () => {
  const env = { ...preview, NEXTAUTH_URL: "http://localhost:3107" };
  expect(configurePreviewOrigin(env)).toBe(true);
  expect(env.NEXTAUTH_URL).toBe(
    "https://panteralab-homologacao-fixture.vercel.app",
  );
});
test.each([
  { VERCEL_ENV: "production" },
  { VERCEL_PROJECT_ID: "prj_FRcbozdufCmWfO6FNmFLtyYwKT1S" },
  { VERCEL: "" },
])(
  "production and other projects keep their original auth origin %j",
  (override) => {
    const env = {
      ...preview,
      ...override,
      NEXTAUTH_URL: "https://panteralab.com.br",
    };
    expect(configurePreviewOrigin(env)).toBe(false);
    expect(env.NEXTAUTH_URL).toBe("https://panteralab.com.br");
  },
);
test.each([
  "attacker.example",
  "panteralab.com.br",
  "panteralab-homologacao-test.vercel.app/evil",
  "panteralab-homologacao-test.vercel.app@evil.example",
])("untrusted preview origin fails closed %s", (host) => {
  expect(() =>
    configurePreviewOrigin({ ...preview, VERCEL_URL: host }),
  ).toThrow();
});
