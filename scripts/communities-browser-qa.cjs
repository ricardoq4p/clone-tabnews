// Local fixtures only: no database, real accounts or destructive network requests.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.QA_BASE_URL || "http://localhost:3107";
if (new URL(base).hostname !== "localhost")
  throw new Error("Local server required");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.QA_BROWSER_EXECUTABLE
      ? { executablePath: process.env.QA_BROWSER_EXECUTABLE }
      : {}),
  });
  try {
    const context = await browser.newContext();
    let role = "superadmin",
      deletes = 0,
      failDelete = false;
    let items = [
      {
        _id: "123456789012345678901234",
        name: "Comunidade de teste",
        description: "Descrição preservada",
        avatar: "",
        privacy: "private",
        ownerName: "Ana",
        membersCount: 3,
        createdAt: "2026-01-01T12:00:00Z",
      },
    ];
    await context.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/auth/session")
        return route.fulfill({
          json: {
            user: { id: "123456789012345678901235", role, name: "Teste" },
            expires: "2099-01-01",
          },
        });
      if (url.pathname === "/api/admin/comunidades") {
        const q = url.searchParams.get("q"),
          privacy = url.searchParams.get("privacy");
        const filtered = items.filter(
          (x) =>
            (!q || x.name.includes(q)) && (!privacy || x.privacy === privacy),
        );
        return route.fulfill({
          json: {
            items: filtered,
            filtered: filtered.length,
            total: items.length,
            publicCount: items.filter((x) => x.privacy === "public").length,
            privateCount: items.filter((x) => x.privacy === "private").length,
            pages: 1,
          },
        });
      }
      if (url.pathname.startsWith("/api/communities/")) {
        if (route.request().method() === "PATCH") {
          const body = route.request().postDataJSON();
          assert.equal(body.description, "Descrição preservada");
          assert.equal(body.privacy, "private");
          items[0] = { ...items[0], ...body };
          return route.fulfill({ json: items[0] });
        }
        deletes++;
        if (failDelete)
          return route.fulfill({
            status: 503,
            json: { error: "Falha simulada" },
          });
        items = [];
        return route.fulfill({ json: { success: true } });
      }
      return route.fulfill({ json: { items: [], next: null } });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/administracao`);
    await page
      .getByRole("button", { name: "Comunidades", exact: true })
      .click();
    await page.getByRole("heading", { name: "Comunidade de teste" }).waitFor();
    assert.equal(
      await page.getByRole("link", { name: /Visualizar/ }).getAttribute("href"),
      "/comunidades/123456789012345678901234",
    );
    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      fs.mkdirSync(".qa", { recursive: true });
      await page.screenshot({
        path: `.qa/communities-${width}.png`,
        fullPage: true,
      });
    }
    await page.getByLabel("Pesquisar por nome").fill("Ausente");
    await page
      .getByText("Nenhuma comunidade encontrada.", { exact: true })
      .waitFor();
    await page.getByLabel("Pesquisar por nome").fill("");
    await page.getByRole("heading", { name: "Comunidade de teste" }).waitFor();
    await page
      .getByRole("combobox", { name: /^Privacidade/ })
      .selectOption("public");
    await page
      .getByText("Nenhuma comunidade encontrada.", { exact: true })
      .waitFor();
    await page.getByRole("combobox", { name: /^Privacidade/ }).selectOption("");
    await page.getByRole("button", { name: "Editar", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByLabel("Nome", { exact: true })
      .fill("Nome editado");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await page.getByRole("heading", { name: "Nome editado" }).waitFor();
    await page.getByRole("button", { name: "Excluir", exact: true }).click();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    assert.equal(deletes, 0);
    await page.getByRole("button", { name: "Excluir", exact: true }).click();
    await page.keyboard.press("Escape");
    assert.equal(deletes, 0);
    failDelete = true;
    await page.getByRole("button", { name: "Excluir", exact: true }).click();
    await page.getByRole("button", { name: "Confirmar exclusão" }).click();
    await page.getByText("Falha simulada", { exact: true }).waitFor();
    assert.equal(items.length, 1);
    failDelete = false;
    await page.getByRole("button", { name: "Confirmar exclusão" }).click();
    await page
      .getByText(
        "Comunidade excluída. Os registros relacionados foram preservados.",
      )
      .waitFor();
    await page
      .getByText("Nenhuma comunidade encontrada.", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Participantes", exact: true })
      .click();
    role = "user";
    await page.reload();
    await page.getByText("Um espaço reservado.", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Comunidades", exact: true })
        .count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS communities: access, filters, view URL, edit, cancellation/Escape, deletion failure/success, responsive 320/768/1280, other tab",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
