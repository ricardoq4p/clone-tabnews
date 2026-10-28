const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    (fs.existsSync(
      path.join(__dirname, "../.qa/playwright-temp/node_modules/playwright"),
    )
      ? path.join(__dirname, "../.qa/playwright-temp/node_modules/playwright")
      : "playwright"),
);
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3107";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw Error("This QA script only accepts a local server.");

(async () => {
  fs.mkdirSync(".qa/audio", { recursive: true });
  const defaultChrome =
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.QA_BROWSER_EXECUTABLE ||
      (fs.existsSync(defaultChrome) ? defaultChrome : undefined),
    args: ["--autoplay-policy=document-user-activation-required"],
  });
  const report = { checks: [], screenshots: [], errors: [] };
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      const NativeAudio = window.Audio;
      window.__qaMercyAudios = [];
      window.Audio = function (...args) {
        const media = new NativeAudio(...args);
        window.__qaMercyAudio = media;
        window.__qaMercyAudios.push(media);
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

    await page.goto(`${base}/terco-da-misericordia`);
    await page
      .getByRole("button", { name: "Iniciar oração", exact: true })
      .waitFor();

    // 1. Confirma que as gravações reais estão integradas na interface
    assert.equal(
      await page.getByText("ORAÇÃO GUIADA POR VOZ E TEXTO").count(),
      1,
    );
    assert.equal(
      await page
        .getByText("Gravações integradas para reprodução contínua.")
        .count(),
      1,
    );
    report.checks.push("Manifesto integrado reconhecido na tela inicial");

    // 2. Inicia oração sem autoplay e confirma que o áudio não inicia sozinho
    await page
      .getByRole("button", { name: "Iniciar oração", exact: true })
      .click();
    const player = page.getByRole("region", {
      name: "Reprodutor de áudio do Terço da Misericórdia",
    });
    await player.waitFor();
    assert.equal(
      await player.getByText("Gravações definitivas em preparação").count(),
      0,
    );
    await page.waitForTimeout(400);
    assert.equal(
      await player.getByRole("button", { name: "Pausar áudio" }).count(),
      0,
    );
    report.checks.push("Áudio não inicia sem clique explícito do usuário");

    // 3. Reproduz 01-sinal-da-cruz.mp3, pausa e testa velocidades preservando posição
    await player
      .getByRole("button", { name: "Reproduzir áudio", exact: true })
      .click();
    await page.waitForTimeout(1600);
    await player
      .getByRole("button", { name: "Pausar áudio", exact: true })
      .click();

    const savedTime = () =>
      page.evaluate(() => {
        const key = Object.keys(localStorage).find((k) =>
          k.startsWith("panteralab.misericordia.audio.v1."),
        );
        return key ? JSON.parse(localStorage.getItem(key)) : null;
      });

    const paused = await savedTime();
    assert.ok(paused && paused.time > 0, "Reprodução avançou o tempo real");
    const mediaInfo = await page.evaluate(() => ({
      src: window.__qaMercyAudio.currentSrc,
      duration: window.__qaMercyAudio.duration,
      playingCount: window.__qaMercyAudios.filter((a) => !a.paused).length,
    }));
    assert.ok(
      mediaInfo.src.endsWith("/audio/misericordia/01-sinal-da-cruz.mp3"),
    );
    assert.ok(mediaInfo.duration > 6);
    assert.equal(mediaInfo.playingCount, 0);

    for (const rate of ["1", "1.25", "1.5", "2"]) {
      await player.getByLabel("Velocidade", { exact: true }).selectOption(rate);
      const saved = await savedTime();
      assert.equal(saved.rate, Number(rate));
      assert.equal(
        await page.evaluate(() => window.__qaMercyAudio.playbackRate),
        Number(rate),
      );
      assert.ok(
        Math.abs(saved.time - paused.time) < 0.15,
        "Troca de velocidade preserva posição do áudio",
      );
    }
    report.checks.push(
      "Reprodução real de 01-sinal-da-cruz.mp3, pausa e 4 velocidades preservam posição",
    );

    // 4. Recarrega a página, retoma a oração e confirma retomada exata do ponto pausado
    await page.reload();
    await page.getByRole("button", { name: /Continuar oração/ }).click();
    await page.waitForTimeout(400);
    assert.equal(
      await player.getByLabel("Velocidade", { exact: true }).inputValue(),
      "2",
    );
    assert.ok(
      await page.evaluate(() => window.__qaMercyAudio.currentTime > 0),
      "Posição restaurada após reload",
    );
    assert.equal(
      await player.getByRole("button", { name: "Continuar áudio" }).count(),
      1,
    );

    // 5. Continua o áudio em modo automático (continuous) e aguarda avanço automático para 02-pai-nosso.mp3
    await player
      .getByRole("button", { name: "Continuar áudio", exact: true })
      .click();
    await page.waitForFunction(
      () => {
        const key = Object.keys(localStorage).find((k) =>
          k.startsWith("panteralab.misericordia.v1."),
        );
        return (
          key && JSON.parse(localStorage.getItem(key)).progress.position === 1
        );
      },
      null,
      { timeout: 15000 },
    );
    await page.waitForTimeout(600);
    const step2Info = await page.evaluate(() => ({
      src: window.__qaMercyAudio.currentSrc,
      playingCount: window.__qaMercyAudios.filter((a) => !a.paused).length,
    }));
    assert.ok(step2Info.src.endsWith("/audio/misericordia/02-pai-nosso.mp3"));
    assert.equal(step2Info.playingCount, 1, "Apenas um áudio tocando por vez");
    await player
      .getByRole("button", { name: "Pausar áudio", exact: true })
      .click();
    report.checks.push(
      "Retomada respeita posição atual e avança automaticamente de 01-sinal-da-cruz.mp3 para 02-pai-nosso.mp3",
    );

    // 6. Verifica navegação manual e reprodução real de todos os 8 arquivos sem sobreposição de áudio
    const targetSteps = [
      [2, "03-ave-maria.mp3"],
      [3, "04-credo.mp3"],
      [4, "05-eterno-pai.mp3"],
      [5, "06-pela-sua-dolorosa-paixao.mp3"],
    ];
    for (const [, expectedFile] of targetSteps) {
      await player
        .getByRole("button", {
          name: "Próxima etapa pelo reprodutor",
          exact: true,
        })
        .click();
      await player
        .getByRole("button", {
          name: /Reproduzir áudio|Continuar áudio/,
        })
        .click();
      await page.waitForTimeout(500);
      const info = await page.evaluate(() => ({
        src: window.__qaMercyAudio.currentSrc,
        time: window.__qaMercyAudio.currentTime,
        duration: window.__qaMercyAudio.duration,
        playingCount: window.__qaMercyAudios.filter((a) => !a.paused).length,
      }));
      assert.ok(
        info.src.endsWith(`/audio/misericordia/${expectedFile}`),
        `Esperava ${expectedFile}, obteve ${info.src}`,
      );
      assert.ok(info.duration > 5, `${expectedFile} deve ter duração válida`);
      assert.equal(
        info.playingCount,
        1,
        `Apenas 1 áudio deve tocar durante ${expectedFile}`,
      );
      await player
        .getByRole("button", { name: "Pausar áudio", exact: true })
        .click();
    }

    // Navega pelo roteiro lateral para Invocação Final (07-deus-santo.mp3) e Oração Conclusiva (08-oracao-conclusiva.mp3)
    const nav = page.getByRole("complementary", {
      name: "Roteiro do Terço da Misericórdia",
    });
    await nav.getByRole("button", { name: /Invocação Final/i }).click();
    await player
      .getByRole("button", { name: /Reproduzir áudio|Continuar áudio/ })
      .click();
    await page.waitForTimeout(500);
    assert.ok(
      (await page.evaluate(() => window.__qaMercyAudio.currentSrc)).endsWith(
        "/audio/misericordia/07-deus-santo.mp3",
      ),
    );
    assert.equal(
      await page.evaluate(
        () => window.__qaMercyAudios.filter((a) => !a.paused).length,
      ),
      1,
    );
    await player
      .getByRole("button", { name: "Pausar áudio", exact: true })
      .click();

    await nav.getByRole("button", { name: /Oração Conclusiva/i }).click();
    await player
      .getByRole("button", { name: /Reproduzir áudio|Continuar áudio/ })
      .click();
    await page.waitForTimeout(500);
    assert.ok(
      (await page.evaluate(() => window.__qaMercyAudio.currentSrc)).endsWith(
        "/audio/misericordia/08-oracao-conclusiva.mp3",
      ),
    );
    assert.equal(
      await page.evaluate(
        () => window.__qaMercyAudios.filter((a) => !a.paused).length,
      ),
      1,
    );
    await player
      .getByRole("button", { name: "Pausar áudio", exact: true })
      .click();
    report.checks.push(
      "Todos os 8 arquivos MP3 (01 a 08) carregam e tocam sem sobreposição de áudios",
    );

    // 7. Responsividade em 1440px, 390px e 320px
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
        `Sem overflow horizontal em ${width}px`,
      );
      const file = `.qa/audio/misericordia-player-${width}.png`;
      await page.screenshot({ path: file });
      report.screenshots.push(file);
    }
    report.checks.push("Reprodutor responsivo em 1440px, 390px e 320px");

    assert.deepEqual(report.errors, []);
    fs.writeFileSync(
      ".qa/audio/misericordia-browser-report.json",
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
