// Local visual regression matrix. APIs are intercepted; no production data or writes.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const AxeBuilder = require(
  process.env.AXE_MODULE || "@axe-core/playwright",
).default;
const base = process.env.QA_BASE_URL || "http://localhost:3120";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Local server required");
const sizes = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [768, 1024],
  [390, 844],
  [320, 568],
];
const cases = process.env.QA_CASES?.split(",");
const selected = (name) => !cases || cases.includes(name);
const routes = [
  ["home", "/"],
  ["rosary", "/rosario"],
  ["chapel", "/capelinha"],
  ["community", "/comunidade"],
  ["login", "/login"],
  ["register", "/register"],
  ["profile", "/profile"],
  ["admin", "/administracao"],
];
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.QA_BROWSER_EXECUTABLE,
  });
  const report = [],
    errors = [];
  fs.mkdirSync(".qa/retro", { recursive: true });
  try {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await context.route("**/api/**", (route) => {
      const url = new URL(route.request().url());
      const p = url.pathname;
      if (p === "/api/auth/session") return route.fulfill({ json: {} });
      if (p === "/api/messages" || p === "/api/communities")
        return route.fulfill({ json: [] });
      if (p === "/api/velas" || p === "/api/velas/minhas")
        return route.fulfill({
          json: { items: [], next: null, serverNow: new Date().toISOString() },
        });
      if (p === "/api/rosario/conteudo")
        return route.fulfill({
          status: 503,
          json: { message: "Conteúdo remoto indisponível no teste local." },
        });
      return route.fulfill({ json: {} });
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      for (const [name, path] of routes.filter(([name]) => selected(name))) {
        const response = await page.goto(base + path, {
          waitUntil: "networkidle",
        });
        assert.equal(response.status(), 200, `${path}: HTTP`);
        await page.evaluate(() => document.fonts.ready);
        const dimensions = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        assert.ok(
          dimensions.scroll <= dimensions.width,
          `${path} ${width}: overflow ${JSON.stringify(dimensions)}`,
        );
        await page.locator("img").evaluateAll((imgs) =>
          Promise.all(
            imgs.map((img) => {
              img.loading = "eager";
              return img.decode().catch(() => {});
            }),
          ),
        );
        const imageErrors = await page
          .locator("img")
          .evaluateAll((imgs) =>
            imgs
              .filter((img) => img.complete && !img.naturalWidth)
              .map((img) => img.src),
          );
        assert.deepEqual(imageErrors, [], `${path}: broken images`);
        await page.screenshot({
          path: `.qa/retro/${name}-${width}x${height}.png`,
          fullPage: true,
          animations: "disabled",
        });
        const item = {
          name,
          width,
          height,
          http: response.status(),
          overflow: false,
        };
        if (width === 1440 || width === 320) {
          const axe = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          item.violations = axe.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          }));
        }
        report.push(item);
      }
    }

    const user = {
      id: "123456789012345678901235",
      name: "Participante de teste",
      email: "visual@example.test",
      role: "superadmin",
    };
    const group = {
      _id: "123456789012345678901234",
      name: "Comunidade de teste",
      description:
        "Espaço de partilha usado exclusivamente na verificação local.",
      privacy: "public",
      avatar: "",
      createdAt: new Date().toISOString(),
      joined: true,
      memberCount: 1,
      members: [user.id],
      owner: user.id,
    };
    const post = {
      _id: "123456789012345678901239",
      content: "Pedido de oração de teste pela paz.",
      author: user.name,
      userId: { _id: user.id, name: user.name, avatar: "/sacred/favicon.svg" },
      category: "prayer",
      createdAt: new Date().toISOString(),
      supportCount: 2,
      prayed: false,
    };
    await context.route("**/api/**", (route) => {
      const p = new URL(route.request().url()).pathname;
      if (p === "/api/auth/session")
        return route.fulfill({
          json: { user, expires: "2099-01-01T00:00:00.000Z" },
        });
      if (p === "/api/users/me")
        return route.fulfill({
          json: {
            ...user,
            _id: user.id,
            username: "teste-local",
            bio: "Perfil sintético para revisão visual.",
            avatar: "",
            createdAt: new Date().toISOString(),
          },
        });
      if (p === "/api/calories")
        return route.fulfill({
          json: {
            entries: [],
            goal: 1200,
            totalCalories: 0,
            remainingCalories: 1200,
          },
        });
      if (p === "/api/messages") return route.fulfill({ json: [post] });
      if (p === "/api/communities") return route.fulfill({ json: [group] });
      if (p === "/api/comments") return route.fulfill({ json: [] });
      if (p.startsWith("/api/communities/"))
        return route.fulfill({ json: group });
      if (p === "/api/admin/comunidades")
        return route.fulfill({
          json: {
            items: [group],
            filtered: 1,
            total: 1,
            publicCount: 1,
            privateCount: 0,
            pages: 1,
          },
        });
      if (p === "/api/admin/estatisticas")
        return route.fulfill({
          json: {
            users: 1,
            activeCandles: 1,
            prayers: 1,
            rosaries: 1,
            reports: 0,
            candles: 1,
          },
        });
      return route.fulfill({ json: { items: [], next: null } });
    });
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      for (const [name, path] of [
        ["profile-auth", "/profile"],
        ["forum-auth", "/comunidades/" + group._id],
        ["community-auth", "/comunidade"],
        ["admin-auth", "/administracao"],
        ["admin-communities", "/administracao"],
        ["admin-dialog", "/administracao"],
      ].filter(([name]) => selected(name))) {
        await page.goto(base + path, { waitUntil: "networkidle" });
        if (name === "admin-communities" || name === "admin-dialog") {
          await page
            .getByRole("button", { name: "Comunidades", exact: true })
            .click();
          await page
            .getByRole("heading", { name: group.name, exact: true })
            .waitFor();
          if (name === "admin-dialog")
            await page
              .getByRole("button", { name: "Editar", exact: true })
              .click();
        }
        await page.evaluate(() => document.fonts.ready);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          name + " " + width + " overflow",
        );
        await page.screenshot({
          path: ".qa/retro/" + name + "-" + width + "x" + height + ".png",
          fullPage: true,
          animations: "disabled",
        });
        const item = { name, width, height, overflow: false };
        if (width === 1440 || width === 320) {
          const axe = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          item.violations = axe.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          }));
        }
        report.push(item);
      }
    }
    // Keyboard access, browser text scaling/reflow, and motion preference.
    await page.goto(base, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.textContent.trim()),
      "Ir para o conteúdo",
    );
    assert.notEqual(
      await page
        .locator(".p-skip")
        .evaluate((el) => getComputedStyle(el).outlineStyle),
      "none",
    );
    await page.keyboard.press("Enter");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "conteudo",
    );
    await page.setViewportSize({ width: 640, height: 900 });
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      "200% text reflow",
    );
    assert.equal(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      cases ? ".qa/retro/modal-report.json" : ".qa/retro/report.json",
      JSON.stringify(
        {
          report,
          errors,
          checks: ["keyboard skip/focus", "200% text reflow", "reduced motion"],
          note: "All API responses are isolated local fixtures. Public matrix includes visitor gates. Authenticated matrix uses synthetic accounts, profile, posts and administrative records. Functional flows also use browser-qa and communities-browser-qa.",
        },
        null,
        2,
      ),
    );
    const failures = report.filter((r) => r.violations?.length);
    console.log(
      JSON.stringify(
        { screenshots: report.length, axeFailures: failures, errors },
        null,
        2,
      ),
    );
    assert.equal(
      failures.length,
      0,
      "Accessibility violations; see .qa/retro/report.json",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
