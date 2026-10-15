/* Isolated, opt-in Windows local stack. Never reads production credentials. */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn, spawnSync } = require("node:child_process");
const { MongoClient } = require("mongodb");
const root = path.resolve(__dirname, "..");
const qa = path.join(root, ".qa");
const runtime = path.join(qa, "runtime");
const statePath = path.join(qa, "local-stack.json");
const pidPath = path.join(qa, "local-processes.json");
const base = "http://localhost:3107";
fs.mkdirSync(qa, { recursive: true });
function config() {
  if (!fs.existsSync(statePath)) {
    fs.writeFileSync(
      statePath,
      JSON.stringify(
        {
          version: 1,
          database: "panteralab_homologacao",
          port: 27027,
          adminPassword: crypto.randomBytes(32).toString("hex"),
          databasePassword: crypto.randomBytes(32).toString("hex"),
          sessionSecret: crypto.randomBytes(48).toString("hex"),
        },
        null,
        2,
      ),
      { mode: 0o600, flag: "wx" },
    );
  }
  const value = JSON.parse(fs.readFileSync(statePath, "utf8"));
  if (value.database !== "panteralab_homologacao" || value.port !== 27027)
    throw new Error("Refusing a non-local database configuration.");
  for (const key of ["adminPassword", "databasePassword", "sessionSecret"])
    if (!/^[a-f0-9]{64,96}$/.test(value[key] || ""))
      throw new Error("Invalid local credentials.");
  return value;
}
function environment() {
  const cfg = config();
  const env = { ...process.env };
  for (const name of Object.keys(env)) {
    if (
      /^(MONGODB|NEXTAUTH|BREVO|EMAIL_|SMTP_|PUSHER|NEXT_PUBLIC_|OPENAI|SUPERADMIN|VERCEL|PANTERALAB_|RATE_LIMIT_|MP_)/.test(
        name,
      )
    )
      delete env[name];
  }
  return {
    ...env,
    MONGODB_URI: `mongodb://panteralab_local:${cfg.databasePassword}@127.0.0.1:27027/panteralab_homologacao?authSource=panteralab_homologacao`,
    RATE_LIMIT_LOGIN_MAX: "50",
    RATE_LIMIT_LOGIN_WINDOW_MS: "60000",
    RATE_LIMIT_REGISTER_WINDOW_MS: "60000",
    RATE_LIMIT_FORGOT_PASSWORD_WINDOW_MS: "60000",
    RATE_LIMIT_RESET_PASSWORD_WINDOW_MS: "60000",
    NEXTAUTH_SECRET: cfg.sessionSecret,
    NEXTAUTH_URL: base,
    NEXT_PUBLIC_APP_ENV: "homologacao-local",
    PANTERALAB_HOMOLOGATION: "local",
    PANTERALAB_LOCAL_SMTP: "true",
    EMAIL_FROM: "PanteraLab local <oracao@panteralab.test>",
    ALLOW_LEGACY_EMAIL_VERIFICATION_FALLBACK: "false",
    TRUST_PROXY_HEADERS: "false",
    NEXT_TELEMETRY_DISABLED: "1",
    // Empty values deliberately override any .env.local: external integrations stay off.
    BREVO_USER: "",
    BREVO_KEY: "",
    OPENAI_API_KEY: "",
    PUSHER_APP_ID: "",
    PUSHER_KEY: "",
    PUSHER_SECRET: "",
    PUSHER_CLUSTER: "",
    NEXT_PUBLIC_PUSHER_KEY: "",
    NEXT_PUBLIC_PUSHER_CLUSTER: "",
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "",
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: "",
  };
}
async function waitFor(test, label, timeout = 45000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    try {
      if (await test()) return;
    } catch {
      /* service is starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${label} did not become ready. See .qa/local-*.log.`);
}
function launch(name, exe, args, env) {
  const log = fs.openSync(path.join(qa, `local-${name}.log`), "a");
  const child = spawn(exe, args, {
    cwd: root,
    env,
    windowsHide: true,
    detached: true,
    stdio: ["ignore", log, log],
  });
  child.unref();
  fs.closeSync(log);
  const pids = fs.existsSync(pidPath)
    ? JSON.parse(fs.readFileSync(pidPath, "utf8"))
    : {};
  pids[name] = {
    pid: child.pid,
    executable: path.resolve(exe),
    workspace: root,
  };
  fs.writeFileSync(pidPath, JSON.stringify(pids, null, 2));
}
async function bootstrap() {
  const cfg = config();
  const adminUri = `mongodb://panteralab_bootstrap:${cfg.adminPassword}@127.0.0.1:27027/admin`;
  let admin = new MongoClient(adminUri, { serverSelectionTimeoutMS: 2000 });
  try {
    await admin.connect();
  } catch {
    await admin.close();
    const first = new MongoClient("mongodb://127.0.0.1:27027/admin", {
      serverSelectionTimeoutMS: 2000,
    });
    await first.connect();
    try {
      await first.db("admin").command({
        createUser: "panteralab_bootstrap",
        pwd: cfg.adminPassword,
        roles: [{ role: "root", db: "admin" }],
      });
    } finally {
      await first.close();
    }
    admin = new MongoClient(adminUri);
    await admin.connect();
  }
  try {
    const db = admin.db(cfg.database);
    const users = await db.command({ usersInfo: "panteralab_local" });
    if (!users.users.length)
      await db.command({
        createUser: "panteralab_local",
        pwd: cfg.databasePassword,
        roles: [{ role: "readWrite", db: cfg.database }],
      });
  } finally {
    await admin.close();
  }
}
async function start() {
  for (const port of [27027, 1025, 8025, 3107]) {
    await new Promise((resolve, reject) => {
      const server = require("node:net").createServer();
      server.once("error", () =>
        reject(
          new Error(
            `Port ${port} already occupied; refusing to use another service.`,
          ),
        ),
      );
      server.listen(port, "127.0.0.1", () => server.close(resolve));
    });
  }
  for (const binary of ["mongod.exe", "mailpit.exe"])
    if (!fs.existsSync(path.join(runtime, binary)))
      throw new Error(
        `Missing ${binary}; run scripts/install-local-services.ps1.`,
      );
  if (fs.existsSync(pidPath))
    throw new Error(
      "Stack already registered. Use status or stop before restarting.",
    );
  const env = environment();
  fs.mkdirSync(path.join(qa, "mongodb-data"), { recursive: true });
  launch(
    "mongodb",
    path.join(runtime, "mongod.exe"),
    [
      "--bind_ip",
      "127.0.0.1",
      "--port",
      "27027",
      "--auth",
      "--dbpath",
      path.join(qa, "mongodb-data"),
    ],
    env,
  );
  await waitFor(async () => {
    const c = new MongoClient("mongodb://127.0.0.1:27027", {
      serverSelectionTimeoutMS: 500,
    });
    try {
      await c.db("admin").command({ ping: 1 });
      return true;
    } finally {
      await c.close();
    }
  }, "MongoDB");
  await bootstrap();
  launch(
    "mailpit",
    path.join(runtime, "mailpit.exe"),
    [
      "--listen",
      "127.0.0.1:8025",
      "--smtp",
      "127.0.0.1:1025",
      "--database",
      path.join(qa, "mailpit.db"),
      "--max",
      "500",
      "--allowed-hosts",
      "localhost,127.0.0.1",
      "--smtp-disable-rdns",
    ],
    env,
  );
  await waitFor(
    async () => (await fetch("http://127.0.0.1:8025/api/v1/info")).ok,
    "Mailpit",
  );
  if (!fs.existsSync(path.join(root, ".next", "BUILD_ID")))
    throw new Error("Run the build command first.");
  launch(
    "web",
    process.execPath,
    [
      path.join(root, "node_modules", "next", "dist", "bin", "next"),
      "start",
      "-p",
      "3107",
      "-H",
      "127.0.0.1",
    ],
    env,
  );
  await waitFor(async () => (await fetch(base)).ok, "PanteraLab");
  console.log(
    `Homologação local: ${base}\nCaixa de emails: http://localhost:8025\nMongoDB autenticado em loopback; serviços externos desligados.`,
  );
}
function stop() {
  if (!fs.existsSync(pidPath)) {
    console.log("No registered local stack.");
    return;
  }
  const entries = JSON.parse(fs.readFileSync(pidPath, "utf8"));
  // Validate ownership using both executable and workspace in the live command line.
  for (const { pid, executable, workspace } of Object.values(
    entries,
  ).reverse()) {
    if (!Number.isSafeInteger(pid) || workspace !== root)
      throw new Error("Invalid process record.");
    const quote = (s) => "'" + s.replace(/'/g, "''") + "'";
    const code = `$p=Get-CimInstance Win32_Process -Filter "ProcessId=${pid}"; if ($p -and $p.ExecutablePath -eq ${quote(executable)} -and $p.CommandLine.Contains(${quote(workspace)})) { Stop-Process -Id ${pid} -ErrorAction Stop }`;
    const result = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-Command", code],
      { windowsHide: true, encoding: "utf8" },
    );
    if (result.status !== 0)
      throw new Error(
        "Could not stop owned process; inspect the stack manually.",
      );
  }
  fs.unlinkSync(pidPath);
  console.log("Local stack stopped. Database and emails preserved.");
}
async function main() {
  const command = process.argv[2] || "status";
  if (command === "build") {
    const result = spawnSync(
      process.execPath,
      [path.join(root, "node_modules", "next", "dist", "bin", "next"), "build"],
      { cwd: root, env: environment(), stdio: "inherit", windowsHide: true },
    );
    process.exitCode = result.status ?? 1;
  } else if (command === "start") await start();
  else if (command === "stop") stop();
  else if (command === "status") {
    for (const url of [base, "http://localhost:8025"]) {
      try {
        console.log(`${url}: ${(await fetch(url)).status}`);
      } catch {
        console.log(`${url}: offline`);
      }
    }
  } else throw new Error("Use build, start, stop or status.");
}
if (require.main === module)
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
module.exports = { environment, config, base, root };
