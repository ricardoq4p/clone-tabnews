/* Local-only browser verification. Authenticated flows below use explicit HTTP fixtures,
   never real accounts, SMTP, Pusher or a database. Screenshots are ignored by Git. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.QA_BASE_URL || "http://localhost:3107";
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname))
  throw new Error("Browser QA is restricted to a local server.");
const output = path.resolve(".qa");
fs.mkdirSync(output, { recursive: true });
const report = [],
  errors = [];
function track(page) {
  page.on("pageerror", (error) => errors.push(error.message));
}
async function noOverflow(page, label) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    `${label}: horizontal overflow`,
  );
}
async function photo(page, name) {
  await page.screenshot({
    path: path.join(output, name),
    fullPage: true,
    animations: "disabled",
  });
}
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.QA_BROWSER_EXECUTABLE
      ? { executablePath: process.env.QA_BROWSER_EXECUTABLE }
      : {}),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    await context.route("**/api/auth/session", (route) =>
      route.fulfill({ json: {} }),
    );
    const page = await context.newPage();
    track(page);
    page.setDefaultTimeout(30000);
    let response = await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator("html").getAttribute("lang"), "pt-BR");
    await noOverflow(page, "desktop home");
    await photo(page, "home-desktop.png");
    report.push("Desktop home: 200, language, responsive layout");
    await page
      .getByRole("link", { name: "Começar a rezar", exact: true })
      .click();
    await page.getByRole("button", { name: "Começar este momento" }).waitFor();
    await page.getByRole("button", { name: /Luminosos/ }).click();
    await page.getByRole("button", { name: "Começar este momento" }).click();
    await page
      .getByRole("heading", { name: "Sinal da Cruz", exact: true })
      .waitFor();
    for (let i = 0; i < 4; i++)
      await page
        .getByRole("button", { name: "Próxima oração", exact: true })
        .click();
    await page
      .getByRole("heading", { name: "Ave-Maria", exact: true })
      .waitFor();
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("panteralab.rosary.v1.visitor"))
          ?.progress.position === 4,
    );
    await photo(page, "rosary-desktop.png");
    await noOverflow(page, "desktop rosary");
    await page
      .getByRole("button", { name: "Recolhimento", exact: true })
      .click();
    assert.equal(await page.locator(".p-header").isVisible(), false);
    await page.getByRole("button", { name: "Sair do recolhimento" }).click();
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Continuar oração" }).click();
    await page
      .getByRole("heading", { name: "Ave-Maria", exact: true })
      .waitFor();
    report.push(
      "Rosary: mystery selection, prayer navigation, focus mode, persisted visitor resume",
    );
    // Change the mocked identity while staying on the same page: caches cannot cross accounts.
    let identity = "123456789012345678901235",
      positions = new Map();
    await context.route("**/api/auth/session", (route) =>
      route.fulfill({
        json: {
          user: {
            id: identity,
            name: identity.endsWith("5") ? "Ana" : "Beatriz",
            email: "qa@example.test",
            role: "user",
          },
          expires: "2099-01-01T00:00:00.000Z",
        },
      }),
    );
    await context.route("**/api/users/presence", (route) =>
      route.fulfill({ json: { success: true } }),
    );
    await context.route("**/api/rosario/progresso", async (route) => {
      if (route.request().method() === "GET")
        return route.fulfill({ json: { progress: null, revision: 0 } });
      const payload = route.request().postDataJSON();
      positions.set(identity, payload.progress);
      return route.fulfill({
        json: {
          progress: payload.progress,
          revision: payload.expectedRevision + 1,
        },
      });
    });
    await page.evaluate(() =>
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "nextauth.message",
          newValue: JSON.stringify({
            event: "session",
            data: { trigger: "sign-in" },
          }),
        }),
      ),
    );
    await page.locator(".p-account").filter({ hasText: "Ana" }).waitFor();
    await page.getByRole("button", { name: "Começar este momento" }).waitFor();
    assert.equal(
      await page.evaluate(
        (id) => localStorage.getItem(`panteralab.rosary.v1.${id}`),
        identity,
      ),
      null,
    );
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("panteralab.rosary.v1.visitor"))
            .progress.position,
      ),
      4,
    );
    await page.getByRole("button", { name: "Começar este momento" }).click();
    await page
      .getByRole("button", { name: "Próxima oração", exact: true })
      .click();
    await page.waitForFunction(
      (id) =>
        JSON.parse(localStorage.getItem(`panteralab.rosary.v1.${id}`))?.progress
          .position === 1,
      identity,
    );
    identity = "123456789012345678901236";
    await page.evaluate(() =>
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "nextauth.message",
          newValue: JSON.stringify({
            event: "session",
            data: { trigger: "sign-in" },
          }),
        }),
      ),
    );
    await page.locator(".p-account").filter({ hasText: "Beatriz" }).waitFor();
    await page.getByRole("button", { name: "Começar este momento" }).waitFor();
    assert.equal(
      await page.evaluate(
        (id) => localStorage.getItem(`panteralab.rosary.v1.${id}`),
        identity,
      ),
      null,
    );
    report.push(
      "Rosary: changing accounts on the same page does not copy visitor or other-account progress",
    );
    // Check native keyboard navigation before leaving the desktop context.
    await page.goto(base, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(".p-skip").isVisible(), true);
    await page.keyboard.press("Enter");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "conteudo",
    );
    report.push("Keyboard: skip link reaches the main content");
    await context.close();
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    await mobile.route("**/api/auth/session", (route) =>
      route.fulfill({ json: {} }),
    );
    const phone = await mobile.newPage();
    track(phone);
    await phone.goto(base, { waitUntil: "networkidle" });
    await noOverflow(phone, "mobile home");
    await photo(phone, "home-mobile.png");
    await phone.goto(`${base}/rosario`, { waitUntil: "networkidle" });
    await phone.getByRole("button", { name: "Começar este momento" }).click();
    await phone
      .getByRole("heading", { name: "Sinal da Cruz", exact: true })
      .waitFor();
    await noOverflow(phone, "mobile rosary");
    await photo(phone, "rosary-mobile.png");
    await phone.goto(`${base}/capelinha`, { waitUntil: "networkidle" });
    await noOverflow(phone, "mobile chapel");
    await phone
      .getByRole("link", { name: "Entrar e apresentar intenção" })
      .waitFor();
    await photo(phone, "chapel-visitor-mobile.png");
    report.push(
      "Mobile 390px: home, rosary and chapel have no horizontal overflow; visitor access is usable",
    );
    for (const width of [320, 768, 1024]) {
      await phone.setViewportSize({ width, height: 900 });
      for (const route of [
        "/",
        "/rosario",
        "/capelinha",
        "/comunidade",
        "/login",
      ]) {
        await phone.goto(`${base}${route}`, { waitUntil: "networkidle" });
        await noOverflow(phone, `${width}px ${route}`);
      }
    }
    report.push(
      "Responsive matrix: 320px, 768px and 1024px on home, rosary, chapel, community and login",
    );
    await mobile.close();
    // Authenticated chapel uses deterministic, clearly synthetic test data and time.
    const fixture = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const chapel = await fixture.newPage();
    track(chapel);
    const time = new Date("2026-10-15T18:00:00.000Z");
    await chapel.clock.install({ time });
    const session = {
      user: {
        id: "123456789012345678901235",
        name: "Participante de teste",
        email: "qa@example.test",
        role: "user",
      },
      expires: "2099-01-01T00:00:00.000Z",
    };
    const candles = [
      {
        _id: "123456789012345678901230",
        intention: "Intenção de teste que expira agora",
        author: "Participante de teste",
        visibility: "public",
        createdAt: new Date(time.getTime() - 604798000).toISOString(),
        expiresAt: new Date(time.getTime() + 2000).toISOString(),
        status: "active",
        supportCount: 0,
        prayed: false,
      },
      {
        _id: "123456789012345678901231",
        intention:
          "Intenção anônima de teste <script>window.__injected=true</script>",
        author: "Intenção anônima",
        visibility: "anonymous",
        createdAt: time.toISOString(),
        expiresAt: new Date(time.getTime() + 604800000).toISOString(),
        status: "active",
        supportCount: 2,
        prayed: false,
      },
    ];
    let prayers = 0,
      submitted;
    await fixture.route("**/api/auth/session", (route) =>
      route.fulfill({ json: session }),
    );
    await fixture.route("**/api/users/presence", (route) =>
      route.fulfill({ json: {} }),
    );
    await fixture.route("**/api/velas**", async (route) => {
      const url = new URL(route.request().url()),
        method = route.request().method();
      const serverNow = new Date(
        await chapel.evaluate(() => Date.now()),
      ).toISOString();
      if (url.pathname.endsWith("/oracao")) {
        prayers++;
        return route.fulfill({ json: { prayed: true, supportCount: 3 } });
      }
      if (method === "POST") {
        submitted = route.request().postDataJSON();
        const candle = {
          _id: "123456789012345678901232",
          intention: submitted.intention,
          author: "Intenção anônima",
          visibility: submitted.visibility,
          status: "active",
          createdAt: time.toISOString(),
          expiresAt: new Date(time.getTime() + 604800000).toISOString(),
          supportCount: 0,
        };
        candles.push(candle);
        return route.fulfill({ status: 201, json: { candle, serverNow } });
      }
      return route.fulfill({ json: { items: candles, next: null, serverNow } });
    });
    await chapel.goto(`${base}/capelinha`, { waitUntil: "networkidle" });
    await chapel
      .getByText("Intenção de teste que expira agora", { exact: true })
      .waitFor();
    assert.equal(await chapel.evaluate(() => window.__injected), undefined);
    const prayerButton = chapel
      .getByRole("button", { name: "Rezei por esta intenção", exact: true })
      .last();
    await prayerButton.click();
    await chapel
      .getByRole("button", {
        name: "Você rezou por esta intenção",
        exact: true,
      })
      .waitFor();
    assert.equal(prayers, 1);
    await chapel.clock.fastForward(2001);
    await chapel
      .getByText("Intenção de teste que expira agora", { exact: true })
      .waitFor({ state: "hidden" });
    await chapel
      .getByLabel("Sua intenção", { exact: true })
      .fill("Pela paz — intenção de teste");
    await chapel.getByRole("radio", { name: /Anônima/ }).check();
    await chapel.getByRole("checkbox").check();
    await chapel
      .getByRole("button", { name: "Acender vela por 7 dias" })
      .click();
    await chapel.getByText("SUA VELA ESTÁ ACESA", { exact: true }).waitFor();
    assert.equal(submitted.privacyAccepted, true);
    assert.equal(submitted.visibility, "anonymous");
    await photo(chapel, "chapel-authenticated-desktop.png");
    await chapel
      .getByRole("button", { name: "Ver minhas velas", exact: true })
      .click();
    await chapel
      .getByText("Intenção de teste que expira agora", { exact: true })
      .waitFor();
    report.push(
      "Chapel fixtures: anonymous creation and privacy acknowledgement, escaped text, one-click prayer, automatic expiry and preserved history",
    );
    const post = {
      _id: "123456789012345678901239",
      content: "Pedido de oração de teste pela paz.",
      author: "Participante de teste",
      userId: {
        _id: session.user.id,
        name: "Participante de teste",
        avatar: "/sacred/favicon.svg",
      },
      category: "prayer",
      createdAt: time.toISOString(),
      supportCount: 2,
      prayed: false,
    };
    await fixture.route("**/api/messages**", (route) =>
      route.fulfill({ json: [post] }),
    );
    await fixture.route("**/api/communities", (route) =>
      route.fulfill({ json: [] }),
    );
    await fixture.route("**/api/comments**", (route) =>
      route.fulfill({ json: [] }),
    );
    await chapel.goto(`${base}/comunidade`, { waitUntil: "networkidle" });
    await chapel.getByText(post.content, { exact: true }).waitFor();
    await noOverflow(chapel, "authenticated community");
    await photo(chapel, "community-desktop.png");
    session.user.role = "superadmin";
    const edition = await (
      await chapel.request.get(`${base}/api/rosario/conteudo`)
    ).json();
    let reviewed = false,
      moderated = false,
      published = false;
    await fixture.route("**/api/admin/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/estatisticas"))
        return route.fulfill({
          json: {
            users: 1,
            activeCandles: 1,
            prayers: 1,
            rosaries: 1,
            reports: 1,
            candles: 2,
          },
        });
      if (url.pathname.endsWith("/velas"))
        return route.fulfill({
          json: {
            items: [
              {
                _id: candles[1]._id,
                visibility: "anonymous",
                status: "active",
                createdAt: time.toISOString(),
                expiresAt: candles[1].expiresAt,
              },
            ],
            next: null,
          },
        });
      if (url.pathname.endsWith("/revisao")) {
        reviewed = true;
        assert.ok(url.searchParams.get("reason"));
        return route.fulfill({
          json: {
            item: {
              _id: candles[1]._id,
              content: "Texto reservado de teste",
              status: "active",
              visibility: "private",
            },
          },
        });
      }
      if (url.pathname.endsWith("/moderar")) {
        moderated = true;
        assert.equal(route.request().postDataJSON().action, "hide");
        return route.fulfill({
          json: { message: "Moderação de teste registrada." },
        });
      }
      if (url.pathname.endsWith("/rosario")) {
        if (route.request().method() === "GET")
          return route.fulfill({
            json: { content: edition.content, editions: [] },
          });
        const payload = route.request().postDataJSON();
        assert.equal(payload.reviewed, true);
        assert.ok(payload.note);
        published = true;
        return route.fulfill({
          status: 201,
          json: {
            content: { ...payload.content, version: "test-edition" },
            message: "Edição de teste publicada.",
          },
        });
      }
      return route.fulfill({ json: { items: [], next: null } });
    });
    await chapel.goto(`${base}/administracao`, { waitUntil: "networkidle" });
    await chapel.getByRole("button", { name: "Velas", exact: true }).click();
    await chapel.getByText("Registro da comunidade", { exact: true }).waitFor();
    assert.equal(
      await chapel
        .getByText("Texto reservado de teste", { exact: true })
        .count(),
      0,
    );
    await chapel
      .getByLabel("Motivo da revisão ou da ação", { exact: false })
      .fill("Revisão solicitada no teste local.");
    await chapel
      .getByRole("button", { name: "Revisar intenção", exact: true })
      .click();
    await chapel
      .getByText("Texto reservado de teste", { exact: true })
      .waitFor();
    assert.equal(reviewed, true);
    await photo(chapel, "administration-desktop.png");
    await chapel
      .getByRole("button", { name: "Recolher da área pública", exact: true })
      .click();
    await chapel
      .getByText("Moderação de teste registrada.", { exact: true })
      .waitFor();
    assert.equal(moderated, true);
    await chapel.getByRole("button", { name: "Rosário", exact: true }).click();
    await chapel
      .getByLabel("Motivo desta edição", { exact: true })
      .fill("Revisão editorial de teste.");
    await chapel
      .getByRole("checkbox", { name: /Revisei o conteúdo religioso/ })
      .check();
    await chapel.getByRole("button", { name: "Publicar nova edição" }).click();
    await chapel
      .getByText("Edição de teste publicada.", { exact: true })
      .waitFor();
    assert.equal(published, true);
    report.push(
      "Social/admin fixtures: existing comments component, audited review, non-destructive moderation and versioned editorial publication",
    );
    await fixture.close();
    assert.deepEqual(errors, []);
    const result = {
      passed: true,
      runtime: process.version,
      checks: report,
      browserErrors: errors,
      note: "Authenticated flows use HTTP fixtures; persistence contracts and authorization are verified separately with simulated API/model tests; live-service integration remains pending. No production services used.",
    };
    fs.writeFileSync(
      path.join(output, "browser-report.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  fs.writeFileSync(
    path.join(output, "browser-failure.txt"),
    error.stack || String(error),
  );
  console.error(error);
  process.exitCode = 1;
});
