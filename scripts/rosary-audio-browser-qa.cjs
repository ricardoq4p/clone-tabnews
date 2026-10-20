const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3131";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw Error("This QA script only accepts a local server.");

(async () => {
  fs.mkdirSync(".qa/audio", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.QA_BROWSER_EXECUTABLE,
    args: ["--autoplay-policy=document-user-activation-required"],
  });
  const report = { checks: [], screenshots: [], errors: [] };
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      const NativeAudio = window.Audio;
      window.Audio = function (...args) {
        const media = new NativeAudio(...args);
        window.__qaRosaryAudio = media;
        return media;
      };
      window.Audio.prototype = NativeAudio.prototype;
    });
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== new URL(base).origin) return route.abort();
      if (url.pathname === "/api/auth/session")
        return route.fulfill({ json: {} });
      if (url.pathname.startsWith("/api/"))
        return route.fulfill({
          status: 503,
          json: { error: "Local isolated QA" },
        });
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => report.errors.push(error.message));
    await page.goto(`${base}/rosario`);
    await page
      .getByRole("button", { name: "Começar este momento", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: /Gozosos/ })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Começar este momento", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Rezar com áudio", exact: true })
      .click();
    const player = page.getByRole("region", { name: "Rosário com áudio" });
    await player.getByText("0:00 /", { exact: false }).waitFor();
    await page.waitForTimeout(500);
    assert.equal(
      await player.getByRole("button", { name: "Pausar áudio" }).count(),
      0,
    );
    report.checks.push("Audio is opt-in and never autoplays on enabling");

    await player
      .getByRole("button", { name: "Reproduzir áudio", exact: true })
      .click();
    await page.waitForTimeout(1800);
    await player
      .getByRole("button", { name: "Pausar áudio", exact: true })
      .click();
    const savedTime = () =>
      page.evaluate(() => {
        const key = Object.keys(localStorage).find((key) =>
          key.startsWith("panteralab.rosary.audio.v1."),
        );
        return key ? JSON.parse(localStorage.getItem(key)) : null;
      });
    const paused = await savedTime();
    assert.ok(paused.time > 0, "Playback must advance real media time");
    for (const rate of ["1", "1.25", "1.5", "2"]) {
      await player.getByLabel("Velocidade", { exact: true }).selectOption(rate);
      const saved = await savedTime();
      assert.equal(saved.rate, Number(rate));
      assert.equal(
        await page.evaluate(() => window.__qaRosaryAudio.playbackRate),
        Number(rate),
      );
      assert.ok(
        Math.abs(saved.time - paused.time) < 0.1,
        "Speed preserves playback offset",
      );
    }
    report.checks.push(
      "Real MP3 playback, pause, and all four speeds preserve offset",
    );

    await page.reload();
    await page.getByRole("button", { name: /Continuar oração/ }).click();
    await page
      .getByRole("button", { name: "Rezar com áudio", exact: true })
      .click();
    await page.waitForTimeout(500);
    assert.equal(
      await player.getByLabel("Velocidade", { exact: true }).inputValue(),
      "2",
    );
    assert.equal(
      await page.evaluate(() => window.__qaRosaryAudio.playbackRate),
      2,
    );
    assert.equal(
      await player.getByRole("button", { name: "Pausar áudio" }).count(),
      0,
    );
    await player
      .getByRole("button", { name: "Continuar áudio", exact: true })
      .click();
    await player.getByText(/Oração ouvida/).waitFor({ timeout: 25000 });
    assert.ok(
      (await savedTime()).stepId.startsWith("0-"),
      "Manual completion stays on the same bead",
    );
    report.checks.push(
      "Reload restores offset and speed without autoplay; manual completion stays put",
    );

    await player
      .getByLabel("Como avançar", { exact: true })
      .selectOption("continuous");
    await player
      .getByRole("button", { name: "Ouvir novamente", exact: true })
      .click();
    await page.waitForFunction(
      () => {
        const key = Object.keys(localStorage).find((key) =>
          key.startsWith("panteralab.rosary.v1."),
        );
        return (
          key && JSON.parse(localStorage.getItem(key)).progress.position === 1
        );
      },
      null,
      { timeout: 25000 },
    );
    await page.waitForTimeout(500);
    await player
      .getByRole("button", { name: "Pausar áudio", exact: true })
      .click();
    assert.ok((await savedTime()).stepId.startsWith("1-"));
    report.checks.push(
      "Continuous completion advances once to the next real prayer",
    );

    // Navigate through the same controls used in the product, never mutating progress in QA.
    for (let index = 1; index < 8; index++)
      await player
        .getByRole("button", { name: "Próxima oração pelo áudio", exact: true })
        .click();
    await player.getByRole("heading", { name: /anunciação/i }).waitFor();
    await player
      .getByRole("button", {
        name: /Reproduzir áudio|Continuar áudio/,
        exact: true,
      })
      .click();
    await page.waitForTimeout(800);
    await player
      .getByRole("button", { name: "Pausar áudio", exact: true })
      .click();
    assert.ok((await savedTime()).clipId.includes("anunciacao"));
    report.checks.push(
      "First mystery presentation and meditation resolve to the matching audio",
    );

    for (const [width, height] of [
      [1440, 1000],
      [390, 844],
      [320, 568],
    ]) {
      await page.setViewportSize({ width, height });
      await player.scrollIntoViewIfNeeded();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `No horizontal overflow at ${width}`,
      );
      const file = `.qa/audio/player-${width}.png`;
      await page.screenshot({ path: file });
      report.screenshots.push(file);
    }
    report.checks.push("Player fits desktop, 390px and 320px viewports");

    if (process.env.AXE_SCRIPT) {
      await page.addScriptTag({ path: process.env.AXE_SCRIPT });
      const axe = await page.evaluate(async () =>
        window.axe.run(
          document.querySelector('[aria-label="Rosário com áudio"]'),
        ),
      );
      report.accessibility = axe.violations.map(({ id, impact }) => ({
        id,
        impact,
      }));
      assert.deepEqual(report.accessibility, []);
    }
    await player
      .getByRole("button", { name: "Desativar áudio", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Iniciar esta dezena", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Próxima oração", exact: true })
      .click();
    report.checks.push(
      "Traditional navigation still works after disabling audio",
    );
    // Exercise the actual persistence hook with a delayed, entirely mocked API.
    // No account is created and no request reaches a database.
    const { DEFAULT_CONTENT } = require("../lib/rosary/content-v2026-1.js");
    let account = "audio-qa-account-a";
    const remote = new Map();
    const writes = [];
    const syncPage = await context.newPage();
    syncPage.on("pageerror", (error) => report.errors.push(error.message));
    await syncPage.route("**/api/**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === "/api/auth/session")
        return route.fulfill({
          json: {
            user: {
              id: account,
              name: "Conta local de QA",
              email: `${account}@panteralab.test`,
              role: "user",
            },
            expires: new Date(Date.now() + 3600000).toISOString(),
          },
        });
      if (pathname === "/api/rosario/conteudo")
        return route.fulfill({ json: { content: DEFAULT_CONTENT } });
      if (pathname === "/api/rosario/progresso") {
        const owner = account;
        if (route.request().method() === "GET")
          return route.fulfill({
            json: {
              progress: null,
              revision: 0,
              ...remote.get(owner),
              content: DEFAULT_CONTENT,
            },
          });
        const body = route.request().postDataJSON();
        writes.push(body);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const previous = remote.get(owner);
        assert.equal(body.expectedRevision, previous?.revision || 0);
        const record = {
          progress: body.progress,
          revision: (previous?.revision || 0) + 1,
        };
        remote.set(owner, record);
        return route.fulfill({ json: record });
      }
      return route.fulfill({ json: {} });
    });
    await syncPage.goto(`${base}/rosario`);
    await syncPage
      .getByRole("button", { name: "Começar este momento", exact: true })
      .click();
    await syncPage.waitForRequest(
      (request) =>
        request.url().endsWith("/api/rosario/progresso") &&
        request.method() === "PUT",
    );
    await syncPage
      .getByRole("button", { name: "Próxima oração", exact: true })
      .click();
    await syncPage
      .getByRole("button", { name: "Próxima oração", exact: true })
      .click();
    await syncPage
      .getByText("Progresso salvo na sua conta", { exact: false })
      .waitFor({ timeout: 15000 });
    assert.equal(remote.get(account).progress.position, 2);
    assert.equal(writes.at(-1).progress.position, 2);
    assert.ok(
      writes.every((body) => !Object.hasOwn(body.progress, "runId")),
      "Audio run ID never changes the server payload",
    );
    await syncPage
      .getByRole("button", { name: "Rezar com áudio", exact: true })
      .click();
    await syncPage
      .getByRole("button", { name: "Reproduzir áudio", exact: true })
      .click();
    await syncPage.waitForTimeout(700);
    await syncPage
      .getByRole("button", { name: "Pausar áudio", exact: true })
      .click();
    account = "audio-qa-account-b";
    await syncPage.reload();
    await syncPage
      .getByRole("button", { name: "Começar este momento", exact: true })
      .click();
    await syncPage
      .getByRole("button", { name: "Rezar com áudio", exact: true })
      .click();
    await syncPage.waitForTimeout(400);
    assert.equal(
      await syncPage
        .getByRole("button", { name: "Pausar áudio", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await syncPage.evaluate(() => window.__qaRosaryAudio.currentTime),
      0,
    );
    // Let the fake save settle before changing the mocked session again.
    await syncPage
      .getByText("Progresso salvo na sua conta", { exact: false })
      .waitFor();
    account = "audio-qa-account-a";
    await syncPage.reload();
    await syncPage.getByRole("button", { name: /Continuar oração/ }).click();
    await syncPage
      .getByRole("button", { name: "Rezar com áudio", exact: true })
      .click();
    await syncPage
      .getByRole("button", { name: "Continuar áudio", exact: true })
      .waitFor();
    assert.ok(
      await syncPage.evaluate(() => window.__qaRosaryAudio.currentTime > 0),
    );
    report.checks.push(
      "Delayed saves retain the latest step; account switching isolates and restores audio checkpoints without autoplay",
    );
    await syncPage.close();
    assert.deepEqual(report.errors, []);
    fs.writeFileSync(
      ".qa/audio/browser-report.json",
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
