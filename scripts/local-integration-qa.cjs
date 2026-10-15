/* Real HTTP + MongoDB + SMTP local integration. Never mocks an application response. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { MongoClient, ObjectId } = require("mongodb");
const { environment, base, root } = require("./local-homologation.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const env = environment();
const qa = path.join(root, ".qa");
const checks = [],
  errors = [];
const accountsFile = path.join(qa, "local-accounts.json");
const fixtureKey = "local-homologation-v1";
const headers = { Origin: base };
async function json(request, url, method = "GET", data, status = 200) {
  const response = await request.fetch(base + url, { method, headers, data });
  const value = await response.json();
  assert.equal(
    response.status(),
    status,
    `${method} ${url.split("?")[0]}: ${JSON.stringify(value)}`,
  );
  return value;
}
async function eventually(fn, description) {
  for (let i = 0; i < 60; i++) {
    const value = await fn();
    if (value) return value;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Timed out: " + description);
}
async function emailLink(email, kind) {
  return eventually(async () => {
    const listing = await (
      await fetch("http://127.0.0.1:8025/api/v1/messages")
    ).json();
    const relevant = listing.messages.filter((m) =>
      m.To.some((t) => t.Address === email),
    );
    for (const mail of relevant) {
      const content = await (
        await fetch("http://127.0.0.1:8025/api/v1/message/" + mail.ID)
      ).json();
      const links =
        (content.HTML || content.Text || "").match(
          /http:\/\/localhost:3107\/[^\s"<>]+/g,
        ) || [];
      const match = links.find((l) => l.includes(kind));
      if (match) return match.replaceAll("&amp;", "&");
    }
  }, "local SMTP email");
}
async function login(context, account) {
  const csrf = await json(context.request, "/api/auth/csrf");
  const response = await context.request.post(
    base + "/api/auth/callback/credentials",
    {
      headers,
      form: {
        csrfToken: csrf.csrfToken,
        email: account.email,
        password: account.password,
        json: "true",
        callbackUrl: base + "/comunidade",
      },
    },
  );
  const loginResult = await response.json();
  assert.equal(
    response.status(),
    200,
    loginResult.url
      ? new URL(loginResult.url).searchParams.get("error")
      : "Credential callback failed",
  );
  const session = await json(context.request, "/api/auth/session");
  assert.equal(session?.user?.email, account.email, "real credential login");
  return session;
}
async function main() {
  fs.writeFileSync(
    path.join(qa, "local-integration-report.json"),
    JSON.stringify({
      passed: false,
      status: "running",
      startedAt: new Date().toISOString(),
    }),
  );
  const mongo = new MongoClient(env.MONGODB_URI);
  await mongo.connect();
  const db = mongo.db("panteralab_homologacao");
  assert.equal(db.databaseName, "panteralab_homologacao");
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.QA_BROWSER_EXECUTABLE
      ? { executablePath: process.env.QA_BROWSER_EXECUTABLE }
      : {}),
  });
  try {
    const guest = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const contextA = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const contextB = await browser.newContext();
    const adminContext = await browser.newContext();
    for (const context of [guest, contextA, contextB, adminContext]) {
      context.on("page", (page) =>
        page.on("pageerror", (e) => errors.push(e.message)),
      );
      // Network safety: this local stack must not contact a paid or production service.
      await context.route("**/*", (route) =>
        ["localhost", "127.0.0.1"].includes(
          new URL(route.request().url()).hostname,
        )
          ? route.continue()
          : route.abort(),
      );
    }
    let accounts;
    if (fs.existsSync(accountsFile))
      accounts = JSON.parse(fs.readFileSync(accountsFile, "utf8"));
    else {
      accounts = Object.fromEntries(
        ["ana", "jose", "administrador"].map((name) => [
          name,
          {
            name:
              name === "ana"
                ? "Ana · teste local"
                : name === "jose"
                  ? "José · teste local"
                  : "Administrador · teste local",
            email: name + "@panteralab.test",
            password: crypto.randomBytes(18).toString("base64url"),
          },
        ]),
      );
      fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2), {
        mode: 0o600,
        flag: "wx",
      });
    }
    for (const account of Object.values(accounts)) {
      let user = await db.collection("users").findOne({ email: account.email });
      if (!user) {
        await json(
          guest.request,
          "/api/users/register",
          "POST",
          { ...account, role: "superadmin" },
          201,
        );
        user = await db.collection("users").findOne({ email: account.email });
        assert.equal(user.role, "user");
        assert.equal(user.isVerified, false);
        const before = await guest.request.post(
          base + "/api/auth/callback/credentials",
          {
            headers,
            form: {
              csrfToken: (await json(guest.request, "/api/auth/csrf"))
                .csrfToken,
              email: account.email,
              password: account.password,
              json: "true",
            },
          },
        );
        assert.ok(
          (await before.json()).url.includes("error="),
          "unverified account rejected",
        );
      }
      if (!user.isVerified) {
        await json(guest.request, "/api/users/resend-verification", "POST", {
          email: account.email,
        });
        const link = await emailLink(account.email, "/verify?");
        const token = new URL(link).searchParams.get("token");
        assert.notEqual(user.verificationToken, token, "token stored hashed");
        const verifyPage = await guest.newPage();
        await verifyPage.goto(link);
        await verifyPage
          .getByText("Conta verificada com sucesso!", { exact: true })
          .waitFor();
        await verifyPage.close();
        await json(
          guest.request,
          "/api/verify?token=" + token,
          "GET",
          undefined,
          400,
        );
      }
    }
    checks.push(
      "Real registration, rejected unverified login, SMTP capture, resend, email confirmation UI and single-use verification token; public registration cannot grant admin",
    );
    // Local-only manual admin provisioning after real verification; no email-based privilege.
    await db
      .collection("users")
      .updateOne(
        { email: accounts.administrador.email, isVerified: true },
        { $set: { role: "superadmin" } },
      );
    const a = await login(contextA, accounts.ana),
      b = await login(contextB, accounts.jose),
      admin = await login(adminContext, accounts.administrador);
    assert.equal(admin.user.role, "superadmin");
    await json(
      contextA.request,
      "/api/admin/estatisticas",
      "GET",
      undefined,
      403,
    );
    await json(guest.request, "/api/admin/estatisticas", "GET", undefined, 401);
    await json(adminContext.request, "/api/admin/estatisticas");
    checks.push(
      "Three real users, session cookies, authenticated MongoDB and fresh administrative authorization",
    );
    console.log("Real accounts and permissions passed");
    // Ensure repeat runs don't exceed creation limits; no collections are cleared.
    let candleDocs = await db
      .collection("candles")
      .find({
        ownerId: new ObjectId(a.user.id),
        intention: { $regex: "^Homologação local:" },
      })
      .toArray();
    for (const visibility of ["public", "anonymous", "private"]) {
      if (
        !candleDocs.some(
          (c) =>
            c.visibility === visibility &&
            c.status === "active" &&
            c.expiresAt > new Date(),
        )
      ) {
        const result = await json(
          contextA.request,
          "/api/velas",
          "POST",
          {
            accountId: a.user.id,
            intention: `Homologação local: intenção ${visibility} pela paz.`,
            visibility,
            privacyAccepted: true,
            createdAt: "2000-01-01",
            expiresAt: "2099-01-01",
          },
          201,
        );
        assert.equal(
          new Date(result.candle.expiresAt) - new Date(result.candle.createdAt),
          604800000,
        );
      }
    }
    candleDocs = await db
      .collection("candles")
      .find({
        ownerId: new ObjectId(a.user.id),
        intention: { $regex: "^Homologação local:" },
        status: "active",
        expiresAt: { $gt: new Date() },
      })
      .toArray();
    const publicC = candleDocs.find((c) => c.visibility === "public"),
      anon = candleDocs.find((c) => c.visibility === "anonymous"),
      privateC = candleDocs.find((c) => c.visibility === "private");
    const pub = await json(guest.request, "/api/velas");
    assert.ok(pub.items.some((c) => c._id === publicC._id.toString()));
    assert.ok(!pub.items.some((c) => c._id === privateC._id.toString()));
    const publicAnon = pub.items.find((c) => c._id === anon._id.toString());
    for (const forbidden of [a.user.id, accounts.ana.email, accounts.ana.name])
      assert.ok(!JSON.stringify(publicAnon).includes(forbidden));
    await json(
      contextB.request,
      `/api/velas/${privateC._id}`,
      "GET",
      undefined,
      404,
    );
    await json(
      contextB.request,
      `/api/velas/${privateC._id}/oracao`,
      "PUT",
      {},
      404,
    );
    await json(contextA.request, `/api/velas/${privateC._id}`);
    const beforeSupport = await db
      .collection("prayersupports")
      .countDocuments({ targetId: publicC._id });
    const alreadyPrayed = await db
      .collection("prayersupports")
      .findOne({ targetId: publicC._id, userId: new ObjectId(b.user.id) });
    const expectedSupport = beforeSupport + (alreadyPrayed ? 0 : 1);
    const prayers = await Promise.all(
      Array.from({ length: 12 }, () =>
        json(contextB.request, `/api/velas/${publicC._id}/oracao`, "PUT", {}),
      ),
    );
    assert.ok(prayers.every((p) => p.supportCount === expectedSupport));
    assert.equal(
      await db.collection("prayersupports").countDocuments({
        targetId: publicC._id,
        userId: new ObjectId(b.user.id),
      }),
      1,
    );
    await json(contextA.request, `/api/velas/${publicC._id}/oracao`, "PUT", {});
    const twoPeople = await db
      .collection("prayersupports")
      .countDocuments({ targetId: publicC._id });
    assert.equal(twoPeople, 2, "two different real users counted once each");
    checks.push(
      "Candle creation uses server dates (168h), anonymous projections, private access denial and twelve concurrent idempotent prayers on real MongoDB",
    );
    const expiringId = new ObjectId();
    const expiresAt = new Date(Date.now() + 2200);
    await db.collection("candles").insertOne({
      _id: expiringId,
      ownerId: new ObjectId(a.user.id),
      authorName: accounts.ana.name,
      intention: "Homologação local: vela que expirou no teste.",
      visibility: "public",
      status: "active",
      createdAt: new Date(expiresAt - 604800000),
      expiresAt,
      acceptedAt: new Date(),
      policyVersion: "2026-1",
      fixtureKey,
    });
    assert.ok(
      (await json(guest.request, "/api/velas")).items.some(
        (c) => c._id === expiringId.toString(),
      ),
    );
    await new Promise((r) => setTimeout(r, 2300));
    assert.ok(
      !(await json(guest.request, "/api/velas")).items.some(
        (c) => c._id === expiringId.toString(),
      ),
    );
    await json(
      guest.request,
      `/api/velas/${expiringId}`,
      "GET",
      undefined,
      404,
    );
    assert.ok(
      (await json(contextA.request, "/api/velas/minhas")).items.some(
        (c) => c._id === expiringId.toString(),
      ),
    );
    assert.ok(await db.collection("candles").findOne({ _id: expiringId }));
    const indexes = await db.collection("candles").indexes();
    assert.ok(indexes.every((i) => i.expireAfterSeconds === undefined));
    checks.push(
      "Backend expiry with no browser open; expired candle absent publicly and retained in owner history; no candle TTL index",
    );
    const reason = "Homologação local de acesso auditado";
    await json(
      adminContext.request,
      `/api/admin/revisao?type=candle&id=${privateC._id}`,
      "GET",
      undefined,
      400,
    );
    await json(
      adminContext.request,
      `/api/admin/revisao?${new URLSearchParams({ type: "candle", id: privateC._id.toString(), reason })}`,
    );
    assert.ok(
      await db.collection("moderationlogs").findOne({
        action: "review-content",
        targetId: privateC._id.toString(),
      }),
    );
    for (const action of ["hide", "restore"]) {
      await json(adminContext.request, "/api/admin/moderar", "PATCH", {
        type: "candle",
        id: publicC._id.toString(),
        action,
        reason,
      });
      if (action === "hide")
        await json(
          guest.request,
          `/api/velas/${publicC._id}`,
          "GET",
          undefined,
          404,
        );
    }
    assert.equal(
      (
        await db.collection("candles").findOne({ _id: publicC._id })
      ).expiresAt.getTime(),
      publicC.expiresAt.getTime(),
    );
    checks.push(
      "Administrative private review requires a reason and writes audit; hide/restore preserves original expiry",
    );
    const post = await json(
      contextA.request,
      "/api/messages",
      "POST",
      {
        accountId: a.user.id,
        content: "Homologação local: unidos em oração pela paz.",
        category: "prayer",
      },
      201,
    );
    await json(
      contextB.request,
      "/api/comments",
      "POST",
      {
        messageId: post._id,
        content: "Homologação local: estamos unidos em oração.",
      },
      201,
    );
    assert.ok(
      (await json(guest.request, `/api/comments?messageId=${post._id}`)).length,
    );
    const existingGroup = await db.collection("communities").findOne({
      name: "Grupo privado · homologação",
      ownerId: new ObjectId(a.user.id),
      deletedAt: null,
    });
    const group =
      existingGroup ||
      (await json(
        contextA.request,
        "/api/communities",
        "POST",
        {
          name: "Grupo privado · homologação",
          description: "Somente contas locais de teste",
          privacy: "private",
        },
        201,
      ));
    const privatePost = await json(
      contextA.request,
      "/api/messages",
      "POST",
      {
        accountId: a.user.id,
        content: "Conteúdo reservado de homologação.",
        communityId: group._id.toString(),
      },
      201,
    );
    await json(
      contextB.request,
      `/api/comments?messageId=${privatePost._id}`,
      "GET",
      undefined,
      404,
    );
    await json(
      contextB.request,
      `/api/communities/${group._id}/join`,
      "POST",
      { action: "join" },
      403,
    );
    checks.push(
      "Real community posts/comments and private-group access rules; no Pusher or AI credentials used",
    );
    console.log("Chapel, administration and community checks passed");
    const existingPrivacy = await db
      .collection("privacyrequests")
      .findOne({ userId: new ObjectId(a.user.id), kind: "export" });
    if (!existingPrivacy)
      await json(
        contextA.request,
        "/api/conta/solicitacoes",
        "POST",
        {
          accountId: a.user.id,
          kind: "export",
          details: "Homologação local; não executar exclusão.",
        },
        201,
      );
    assert.ok(
      (await json(contextA.request, "/api/conta/solicitacoes")).items.length,
    );
    assert.equal(
      (await json(contextB.request, "/api/conta/solicitacoes")).items.length,
      0,
    );
    assert.ok(
      (await json(adminContext.request, "/api/admin/solicitacoes")).items
        .length,
    );
    checks.push(
      "Privacy request belongs only to its owner and appears in the administrative queue; no export or deletion is executed automatically",
    );
    const page = await contextB.newPage();
    await page.goto(base + "/rosario");
    await page.getByRole("button", { name: "Começar este momento" }).waitFor();
    const continueButton = page.getByRole("button", {
      name: "Continuar oração",
      exact: true,
    });
    if (await continueButton.count()) {
      // Reset the active prayer through the normal, explicitly confirmed UI action.
      await page.getByRole("button", { name: "Começar este momento" }).click();
      await page.getByRole("button", { name: "Confirmar nova oração" }).click();
    } else
      await page.getByRole("button", { name: "Começar este momento" }).click();
    let steps = 0;
    while (true) {
      const next = page.getByRole("button", {
        name: /^(Próxima oração|Iniciar esta dezena|Concluir oração)$/,
      });
      if (!(await next.count())) break;
      await next.click();
      steps++;
      if (steps > 100) throw new Error("Rosary did not finish");
    }
    assert.equal(steps, 82, "all five mysteries and ending prayers traversed");
    await eventually(async () => {
      const p = await json(contextB.request, "/api/rosario/progresso");
      return p.progress?.position === 82;
    }, "saved completed rosary");
    await page.screenshot({
      path: path.join(qa, "local-rosary-complete.png"),
      fullPage: true,
    });
    assert.equal(
      (
        await db
          .collection("rosaryprogresses")
          .findOne({ userId: new ObjectId(b.user.id) })
      ).completed,
      true,
    );
    await page.reload();
    await page
      .getByText(
        "Seu último roteiro foi concluído. Que a oração continue no seu dia.",
        { exact: true },
      )
      .waitFor();
    checks.push(
      "Full guided five-decade rosary: all 82 steps, conclusion, real account persistence and reload",
    );
    await page
      .getByRole("checkbox", { name: /Rezar os quatro conjuntos/ })
      .check();
    await page.getByRole("button", { name: "Começar este momento" }).click();
    let fullSteps = 0;
    while (true) {
      const next = page.getByRole("button", {
        name: /^(Próxima oração|Iniciar esta dezena|Concluir oração)$/,
      });
      if (!(await next.count())) break;
      await next.click();
      fullSteps++;
      if (fullSteps > 310) throw new Error("Full rosary did not finish");
    }
    assert.equal(
      fullSteps,
      292,
      "all twenty mysteries and ending prayers traversed",
    );
    await eventually(async () => {
      const p = await json(contextB.request, "/api/rosario/progresso");
      return p.progress?.position === 292 && p.progress.full;
    }, "saved full rosary");
    checks.push(
      "Full twenty-mystery browser journey: all 292 steps and real account persistence",
    );
    // Full 20-mystery route validated against real API persistence, alongside browser five-decade journey.
    const edition = (await json(guest.request, "/api/rosario/conteudo"))
      .content;
    const progress = {
      version: edition.version,
      setId: edition.sets[0].id,
      full: true,
      fatima: true,
      position: 292,
    };
    let current = await json(contextA.request, "/api/rosario/progresso");
    const saved = await json(
      contextA.request,
      "/api/rosario/progresso",
      "PUT",
      { accountId: a.user.id, progress, expectedRevision: current.revision },
    );
    await json(
      contextA.request,
      "/api/rosario/progresso",
      "PUT",
      { accountId: a.user.id, progress, expectedRevision: current.revision },
      409,
    );
    assert.ok(saved.revision > current.revision);
    checks.push(
      "Full twenty-mystery progress and optimistic concurrent-device conflict on real MongoDB",
    );
    // Real SMTP recovery revokes the existing cookie; the token cannot be reused.
    await json(guest.request, "/api/users/forgot-password", "POST", {
      email: accounts.jose.email,
    });
    const reset = await emailLink(accounts.jose.email, "/reset-password?");
    const token = new URL(reset).searchParams.get("token");
    const nextPassword = crypto.randomBytes(18).toString("base64url");
    await json(guest.request, "/api/users/reset-password", "POST", {
      token,
      password: nextPassword,
    });
    accounts.jose.password = nextPassword;
    fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2), {
      mode: 0o600,
    });
    await json(
      guest.request,
      "/api/users/reset-password",
      "POST",
      { token, password: nextPassword },
      400,
    );
    assert.deepEqual(await json(contextB.request, "/api/auth/session"), {});
    await json(contextB.request, "/api/velas/minhas", "GET", undefined, 401);
    await login(contextB, accounts.jose);
    checks.push(
      "Real SMTP password recovery, single-use reset token, revoked old session and login with new password",
    );
    await json(adminContext.request, "/api/admin/participantes", "PATCH", {
      id: b.user.id,
      action: "disable",
      reason,
    });
    assert.deepEqual(await json(contextB.request, "/api/auth/session"), {});
    await json(adminContext.request, "/api/admin/participantes", "PATCH", {
      id: b.user.id,
      action: "enable",
      reason,
    });
    await json(contextB.request, "/api/velas/minhas", "GET", undefined, 401);
    await login(contextB, accounts.jose);
    checks.push(
      "Suspension revokes real session cookies; reactivation requires a new login",
    );
    for (const [label, context] of [
      ["visitor", guest],
      ["participant", contextA],
      ["administrator", adminContext],
    ]) {
      const view = await context.newPage();
      for (const width of [390, 1440]) {
        await view.setViewportSize({ width, height: 900 });
        for (const route of [
          "/",
          "/rosario",
          "/capelinha",
          "/comunidade",
          ...(label === "administrator" ? ["/administracao"] : []),
        ]) {
          await view.goto(base + route, { waitUntil: "domcontentloaded" });
          await view.locator("main").waitFor();
          if (label !== "visitor")
            await view
              .locator(".p-account")
              .getByText(label === "administrator" ? "Administrador" : "Ana", {
                exact: true,
              })
              .waitFor();
          if (route === "/rosario")
            await view
              .getByRole("button", { name: "Começar este momento" })
              .waitFor();
          if (route === "/capelinha")
            await view
              .getByText("Homologação local: intenção public pela paz.", {
                exact: true,
              })
              .waitFor();
          if (route === "/comunidade")
            await view
              .getByText("Homologação local: unidos em oração pela paz.", {
                exact: true,
              })
              .first()
              .waitFor();
          if (route === "/administracao")
            await view.waitForFunction(
              () =>
                document.querySelector(".p-admin-stat-grid strong")
                  ?.textContent !== "—",
            );
          assert.equal(
            await view.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
            `${label} ${width} ${route}`,
          );
          await view.screenshot({
            path: path.join(
              qa,
              `local-${label}-${width}-${route.slice(1) || "home"}.png`,
            ),
            fullPage: true,
          });
        }
      }
    }
    assert.deepEqual(errors, []);
    checks.push(
      "Visual regression: guest, real participant and real administrator at 390/1440px, no horizontal overflow or browser errors",
    );
    const loginContext = await browser.newContext();
    const loginPage = await loginContext.newPage();
    await loginPage.goto(base + "/login");
    await loginPage.getByLabel(/email/i).fill(accounts.ana.email);
    await loginPage.getByLabel(/senha/i).fill(accounts.ana.password);
    await loginPage
      .getByRole("button", { name: "Entrar", exact: true })
      .click();
    await loginPage.waitForURL("**/comunidade");
    await loginPage.goto(base + "/profile");
    await loginPage
      .getByText(/Envio de fotos indisponível neste ambiente/)
      .waitFor();
    assert.equal(
      await loginPage.locator('input[type="file"]').isDisabled(),
      true,
    );
    await loginContext.close();
    checks.push(
      "Real login form redirects correctly; profile explains disabled Cloudinary uploads in the isolated stack",
    );
    const access = Object.values(accounts)
      .map(
        (a) =>
          `## ${a.name}\n\nEmail: ${a.email}\n\nSenha local: ${a.password}\n`,
      )
      .join("\n");
    fs.writeFileSync(
      path.join(qa, "ACESSOS_LOCAIS.md"),
      `# Contas exclusivas da homologação local\n\n${base}\n\nEmails: http://localhost:8025\n\nDados fictícios locais. Nunca reutilizar estas senhas fora deste ambiente.\n\n${access}`,
    );
    const report = {
      passed: true,
      date: new Date().toISOString(),
      runtime: process.version,
      checks,
      browserErrors: errors,
      externalServices: {
        Brevo: "not tested; real local SMTP capture only",
        Cloudinary: "not configured",
        Pusher: "not configured",
      },
    };
    fs.writeFileSync(
      path.join(qa, "local-integration-report.json"),
      JSON.stringify(report, null, 2),
    );
    const failureFile = path.join(qa, "local-integration-failure.txt");
    if (fs.existsSync(failureFile)) fs.unlinkSync(failureFile);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
    await mongo.close();
  }
}
main().catch((err) => {
  fs.writeFileSync(
    path.join(qa, "local-integration-failure.txt"),
    err.stack || String(err),
  );
  console.error(err.message);
  process.exitCode = 1;
});
