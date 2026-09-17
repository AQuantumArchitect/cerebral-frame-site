import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT || 3000);
const FORM_TO = process.env.FORM_TO || process.env.PUBLIC_EMAIL || "Somapptic@gmail.com";
const DATA = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, "data");
const BUILT_AT = process.env.BUILD_TIME || new Date().toISOString();
const COMMIT = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.COMMIT_SHA || "dev";

const SECURITY = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src https://calendly.com https://*.calendly.com; connect-src 'self'; font-src 'self' data:; base-uri 'self'; form-action 'self'",
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".vcf": "text/vcard; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

function send(res, status, body, type = "text/plain; charset=utf-8", extra = {}) {
  res.writeHead(status, { ...SECURITY, "Content-Type": type, ...extra });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function parseForm(raw, contentType) {
  if ((contentType || "").includes("application/json")) {
    return JSON.parse(raw || "{}");
  }
  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries());
}

function saveInquiry(kind, payload) {
  fs.mkdirSync(path.join(DATA, "inquiries"), { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(DATA, "inquiries", `${stamp}-${kind}.json`);
  fs.writeFileSync(file, JSON.stringify({ kind, at: new Date().toISOString(), payload }, null, 2));
  return file;
}

async function maybeEmail(subject, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { emailed: false };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FORM_FROM || "Cerebral Frame <noreply@cerebralframe.com>",
      to: [FORM_TO],
      subject,
      text,
    }),
  });
  return { emailed: res.ok, status: res.status };
}

function safeFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const candidates = [];
  if (clean === "/" || clean === "") {
    candidates.push(path.join(DIST, "index.html"));
  } else {
    const rel = clean.replace(/^[/\\]+/, "");
    candidates.push(path.join(DIST, rel));
    candidates.push(path.join(DIST, rel, "index.html"));
    if (!path.extname(rel)) candidates.push(path.join(DIST, `${rel}.html`));
  }
  for (const file of candidates) {
    if (!file.startsWith(DIST)) continue;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(
      res,
      200,
      JSON.stringify({ ok: true, builtAt: BUILT_AT, commit: COMMIT }),
      "application/json; charset=utf-8",
    );
  }

  if (req.method === "POST" && (url.pathname === "/api/contact" || url.pathname === "/api/scan")) {
    try {
      const raw = await readBody(req);
      const body = parseForm(raw, req.headers["content-type"]);
      if (body.website) return send(res, 204, "");
      const started = Number(body.t || 0);
      if (started && Date.now() - started < 2500) return send(res, 204, "");
      const kind = url.pathname === "/api/scan" ? "scan" : "contact";
      saveInquiry(kind, body);
      const text = JSON.stringify(body, null, 2);
      await maybeEmail(kind === "scan" ? "Cerebral Frame scan" : "Cerebral Frame inquiry", text).catch(() => ({ emailed: false }));
      if (kind === "contact" && !(req.headers["content-type"] || "").includes("application/json")) {
        res.writeHead(303, { ...SECURITY, Location: "/talk?sent=1" });
        return res.end();
      }
      return send(res, 200, JSON.stringify({ ok: true }), "application/json; charset=utf-8");
    } catch {
      return send(res, 400, JSON.stringify({ ok: false }), "application/json; charset=utf-8");
    }
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method not allowed");
  }

  const file = safeFile(url.pathname);
  if (!file) return send(res, 404, "Not found");
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const stream = fs.createReadStream(file);
  res.writeHead(200, { ...SECURITY, "Content-Type": type, "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400" });
  stream.pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[boot] cerebral-frame-site on :${PORT} dist=${DIST} data=${DATA}`);
});
