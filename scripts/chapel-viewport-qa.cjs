const assert = require("node:assert/strict"),
  fs = require("fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.QA_BASE_URL || "http://localhost:3120";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Local fixtures only");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.QA_BROWSER_EXECUTABLE
      ? { executablePath: process.env.QA_BROWSER_EXECUTABLE }
      : {}),
  });
  try {
    const ctx = await browser.newContext({
      reducedMotion: "reduce",
      hasTouch: true,
    });
    let refresh = 0;
    const now = new Date().toISOString(),
      candles = Array.from({ length: 13 }, (_, i) => ({
        _id: String(i + 1).padStart(24, "0"),
        intention: "Intenção simulada " + (i + 1),
        visibility: "public",
        status: "active",
        authorName: "Teste",
        createdAt: now,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        supportCount: 0,
      }));
    await ctx.route("**/api/**", (r) => {
      const u = new URL(r.request().url());
      if (u.pathname === "/api/auth/session") return r.fulfill({ json: {} });
      if (u.pathname === "/api/velas") {
        refresh++;
        return r.fulfill({
          json: {
            items: candles,
            next: null,
            serverNow: new Date().toISOString(),
          },
        });
      }
      return r.fulfill({ json: {} });
    });
    const page = await ctx.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const report = [];
    for (const [width, height] of [
      [1920, 1080],
      [1440, 900],
      [1366, 768],
      [1280, 720],
      [768, 1024],
      [390, 844],
      [320, 568],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(base + "/capelinha", {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      const scene = page.locator(
        'section[aria-label="Cenário da Capelinha Virtual"]',
      );
      await scene
        .getByRole("button", { name: "Selecionar vela 6", exact: true })
        .first()
        .waitFor();
      await page
        .locator('img[src*="capelinha-"]')
        .evaluate((img) => img.decode());
      const result = await scene.evaluate((el) => {
        const box = el.firstElementChild.getBoundingClientRect(),
          image = el.querySelector("img").getBoundingClientRect(),
          buttons = [...el.firstElementChild.querySelectorAll("button")],
          nav = el.querySelector("button:last-child");
        return {
          scene: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            bottom: box.bottom,
          },
          image: { width: image.width, height: image.height },
          candles: buttons.map((b) => {
            const r = b.getBoundingClientRect();
            return {
              inside:
                r.left >= box.left &&
                r.right <= box.right &&
                r.top >= box.top &&
                r.bottom <= box.bottom,
              x: ((r.left + r.width / 2 - box.left) / box.width) * 100,
              y: ((r.bottom - box.top) / box.height) * 100,
              expectedX: parseFloat(b.style.left),
              expectedY: parseFloat(b.style.top),
            };
          }),
          refreshBottom: [...el.querySelectorAll("button")]
            .find((b) => b.textContent === "Atualizar velas")
            .getBoundingClientRect().bottom,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.equal(result.overflow, false);
      assert.equal(result.candles.length, 6);
      assert.ok(
        Math.abs(result.image.width / result.image.height - 1.5) < 0.01,
      );
      for (const c of result.candles) {
        assert.ok(c.inside);
        assert.ok(Math.abs(c.x - c.expectedX) < 0.1);
        assert.ok(Math.abs(c.y - c.expectedY) < 0.1);
      }
      if (width >= 1024) {
        assert.ok(result.scene.bottom <= height, JSON.stringify(result));
        assert.ok(result.refreshBottom <= height, JSON.stringify(result));
      }
      fs.mkdirSync(".qa", { recursive: true });
      await page.screenshot({
        path: `.qa/viewport-${width}x${height}.png`,
        fullPage: false,
      });
      await scene
        .getByRole("button", { name: "Selecionar vela 1", exact: true })
        .first()
        .click();
      await page
        .locator("#chapel-selected-intention")
        .getByText("Intenção simulada 1", { exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Fechar intenção", exact: true })
        .click();
      const choice = scene
        .getByRole("button", { name: "Selecionar vela 2", exact: true })
        .last();
      assert.ok((await choice.boundingBox()).height >= 44);
      await choice.focus();
      await page.keyboard.press("Enter");
      await page
        .locator("#chapel-selected-intention")
        .getByText("Intenção simulada 2", { exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Fechar intenção", exact: true })
        .click();
      await scene
        .getByRole("button", { name: "Próximas", exact: true })
        .click();
      await scene
        .getByRole("button", { name: "Selecionar vela 7", exact: true })
        .first()
        .waitFor();
      await scene
        .getByRole("button", { name: "Anteriores", exact: true })
        .click();
      await scene
        .getByRole("button", { name: "Atualizar velas", exact: true })
        .click();
      report.push({ width, height, ...result });
      if (width < 1024) {
        await choice.tap();
        await page
          .locator("#chapel-selected-intention")
          .getByText("Intenção simulada 2", { exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: "Fechar intenção", exact: true })
          .click();
      }
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      ".qa/viewport-results.json",
      JSON.stringify({ passed: true, report, refresh, errors }, null, 2),
    );
    console.log(
      "PASS: seven resolutions, six candles aligned, complete desktop scene/controls, mouse, touch, keyboard, pagination, refresh; no overflow or JS errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
