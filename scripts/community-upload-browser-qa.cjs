const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");

const playwrightPath = "C:/Users/Ricardo/panteralab/.qa/tools/node_modules/playwright";
const edgePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const { chromium } = require(playwrightPath);

const PORT = 3118;
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 500) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on("error", reject);
        req.setTimeout(2000, () => req.destroy());
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("Servidor não iniciou a tempo.");
}

(async () => {
  console.log("=== INICIANDO TESTE REAL DE NAVEGADOR PARA UPLOAD DE COMUNIDADE ===");

  // 1. Iniciar servidor Next.js na porta 3118 com uploads habilitados
  const serverEnv = {
    ...process.env,
    PORT: String(PORT),
    NEXT_PUBLIC_UPLOADS_ENABLED: "true",
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "daw3up5vu",
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: "avatar_upload",
    NEXTAUTH_SECRET: "mock-secret-for-browser-qa-purposes-only-32chars",
    NEXTAUTH_URL: BASE_URL,
    MONGODB_URI: "mongodb://127.0.0.1:27027/panteralab_qa_dummy",
  };

  const nextServer = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "start", "-p", String(PORT)],
    {
      cwd: path.resolve(__dirname, ".."),
      env: serverEnv,
      stdio: "pipe",
    },
  );

  nextServer.stderr.on("data", (d) => {
    // console.error("NEXT ERR:", d.toString());
  });

  try {
    console.log(`Aguardando servidor subir em ${BASE_URL}...`);
    await waitForServer(`${BASE_URL}/feed`);
    console.log("Servidor local pronto!");

    // 2. Iniciar navegador Edge
    const browser = await chromium.launch({
      executablePath: edgePath,
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    const sessionUser = {
      id: "123456789012345678901234",
      name: "Ricardo Teste",
      email: "ricardo@panteralab.test",
      role: "user",
    };

    // 3. Rotas interceptadas para simular ambiente controlado
    await context.route("**/api/auth/session", (route) => {
      route.fulfill({
        json: {
          user: sessionUser,
          expires: "2099-01-01T00:00:00.000Z",
        },
      });
    });

    await context.route("**/api/users/me", (route) => {
      route.fulfill({
        json: sessionUser,
      });
    });

    await context.route("**/api/communities", (route) => {
      route.fulfill({
        json: [
          {
            _id: "c1",
            name: "Comunidade Exemplo",
            description: "Grupo de oração",
            membersCount: 5,
            joined: true,
            isOwner: false,
          },
        ],
      });
    });

    await context.route("**/api/messages**", (route) => {
      route.fulfill({ json: [] });
    });

    // Intercepta envio para o Cloudinary
    let cloudinaryUploadCalled = false;
    await context.route("https://api.cloudinary.com/**", (route) => {
      cloudinaryUploadCalled = true;
      route.fulfill({
        status: 200,
        json: {
          secure_url:
            "https://res.cloudinary.com/daw3up5vu/image/upload/v1/avatars/qa-test-community.png",
          public_id: "avatars/qa-test-community",
        },
      });
    });

    await context.route("**/api/users/presence", (route) => {
      route.fulfill({ json: { ok: true } });
    });

    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    console.log("Navegando para /feed...");
    await page.goto(`${BASE_URL}/feed`, { waitUntil: "domcontentloaded" });

    // 4. Clicar no botão 'Criar comunidade'
    const criarBtn = page.getByRole("button", { name: "Criar comunidade" });
    await criarBtn.waitFor({ state: "visible" });
    await criarBtn.click();
    console.log("Formulário 'Nova comunidade' aberto.");

    // 5. Verificar o campo 'Imagem da comunidade' e botão 'Escolher arquivo'
    const escolherBtn = page.getByRole("button", { name: /escolher arquivo/i });
    await escolherBtn.waitFor({ state: "visible" });

    const isEnabled = await escolherBtn.isEnabled();
    assert.equal(isEnabled, true, "O botão 'Escolher arquivo' deve estar habilitado!");
    console.log("VERIFICAÇÃO: Botão 'Escolher arquivo' está visível e habilitado!");

    // 6. Criar uma imagem PNG válida temporária para o teste
    const testImagePath = path.resolve(__dirname, "../.qa/test-community-avatar.png");
    // Imagem 16x16 PNG válida
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVDhPY/wPBAwUACYqGvQMAAC8cQL78j7/AAAAAElFTkSuQmCC",
      "base64",
    );
    fs.writeFileSync(testImagePath, pngBuffer);

    // 7. Simular a seleção de arquivo no input
    const fileInput = page.locator("#create-community-image");
    await fileInput.setInputFiles(testImagePath);
    console.log("Arquivo de imagem selecionado no input.");

    // 8. Aguardar a exibição da prévia e do status de sucesso
    await page.getByAltText("Prévia da comunidade").waitFor({ state: "visible", timeout: 10000 });
    console.log("VERIFICAÇÃO: Imagem de prévia está visível!");

    await page.getByText(/Imagem pronta/i).waitFor({ state: "visible", timeout: 10000 });
    console.log("VERIFICAÇÃO: Upload simulado concluído e status 'Imagem pronta' exibido!");

    assert.equal(cloudinaryUploadCalled, true, "O endpoint da Cloudinary deve ter sido acionado.");

    // 9. Verificar que botões 'Substituir' e 'Remover' estão visíveis e funcionais
    const substituirBtn = page.getByRole("button", { name: /substituir/i });
    const removerBtn = page.getByRole("button", { name: /remover/i });
    assert.equal(await substituirBtn.isVisible(), true, "Botão 'Substituir' deve estar visível");
    assert.equal(await removerBtn.isVisible(), true, "Botão 'Remover' deve estar visível");

    // Tirar screenshot da prévia funcionando
    const screenshotPath = path.resolve(__dirname, "../.qa/community-upload-browser-success.png");
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot salvo em: ${screenshotPath}`);

    // 10. Testar o botão 'Remover'
    await removerBtn.click();
    await page.getByText("Nenhum arquivo selecionado").waitFor({ state: "visible" });
    console.log("VERIFICAÇÃO: Botão 'Remover' limpou a imagem com sucesso e restaurou o botão 'Escolher arquivo'.");

    // Limpar arquivo temporário
    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);

    await browser.close();

    assert.equal(pageErrors.length, 0, `Nenhum erro de página JS: ${pageErrors.join(", ")}`);
    console.log("=== TESTE REAL DE NAVEGADOR FINALIZADO COM 100% DE SUCESSO! ===");
    process.exit(0);
  } finally {
    nextServer.kill();
  }
})().catch((err) => {
  console.error("ERRO NO TESTE DE NAVEGADOR:", err);
  process.exit(1);
});
