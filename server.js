import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  loadBookingConfig,
  generateSlots,
  slotIsOffered,
  makeIcs,
  googleTemplateUrl,
} from "./src/lib/booking.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT || 3000);
const FORM_TO = process.env.FORM_TO || process.env.PUBLIC_EMAIL || "Somapptic@gmail.com";
const DATA = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, "data");
const BUILT_AT = process.env.BUILD_TIME || new Date().toISOString();
const COMMIT = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.COMMIT_SHA || "dev";
const SITE_URL = process.env.PUBLIC_SITE_URL || "https://cerebral-frame-site-production.up.railway.app";

const SECURITY = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(self), microphone=(self), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src https://calendly.com https://*.calendly.com; connect-src 'self'; font-src 'self' data:; base-uri 'self'; form-action 'self'",
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
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".ics": "text/calendar; charset=utf-8",
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

function readBuffer(req, max) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on("data", (c) => {
      n += c.length;
      if (n > max) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
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

function bookingsPath() {
  return path.join(DATA, "bookings.json");
}

function loadBookings() {
  const f = bookingsPath();
  if (!fs.existsSync(f)) return [];
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return [];
  }
}

function saveBookings(list) {
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(bookingsPath(), JSON.stringify(list, null, 2));
}

async function maybeEmail(subject, text, attachments = []) {
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
      attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })),
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

  if (req.method === "GET" && url.pathname === "/api/slots") {
    const config = loadBookingConfig(__dirname);
    const taken = new Set(loadBookings().map((b) => b.start));
    const slots = generateSlots(config, new Date(), taken);
    return send(
      res,
      200,
      JSON.stringify({ ok: true, timezone: config.timezone, duration: config.duration_minutes, slots }),
      "application/json; charset=utf-8",
    );
  }

  const noteGet = url.pathname.match(/^\/api\/note\/([a-f0-9]+)$/);
  if (req.method === "GET" && noteGet) {
    const metaPath = path.join(DATA, "notes", `${noteGet[1]}.json`);
    if (!fs.existsSync(metaPath)) return send(res, 404, "Not found");
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    if (url.searchParams.get("token") !== meta.token) return send(res, 404, "Not found");
    const clip = path.join(DATA, "notes", meta.file);
    if (!fs.existsSync(clip)) return send(res, 404, "Not found");
    res.writeHead(200, { ...SECURITY, "Content-Type": meta.type || "video/mp4", "Cache-Control": "private, no-store" });
    return fs.createReadStream(clip).pipe(res);
  }

  if (req.method === "POST" && url.pathname === "/api/book") {
    try {
      const body = JSON.parse(await readBody(req));
      const name = String(body.name || "").trim().slice(0, 120);
      const reach = String(body.reach || "").trim().slice(0, 120);
      const start = String(body.start || "");
      if (!name || !reach || !start) return send(res, 400, JSON.stringify({ ok: false, error: "Missing fields." }), "application/json; charset=utf-8");
      const config = loadBookingConfig(__dirname);
      if (!slotIsOffered(config, start)) {
        return send(res, 409, JSON.stringify({ ok: false, error: "That slot is not offered." }), "application/json; charset=utf-8");
      }
      const bookings = loadBookings();
      if (bookings.some((b) => b.start === start)) {
        return send(res, 409, JSON.stringify({ ok: false, error: "That slot just went." }), "application/json; charset=utf-8");
      }
      const end = new Date(new Date(start).getTime() + config.duration_minutes * 60000).toISOString();
      const id = crypto.randomBytes(8).toString("hex");
      const token = crypto.randomBytes(16).toString("hex");
      const record = { id, token, start, end, name, reach, at: new Date().toISOString() };
      bookings.push(record);
      saveBookings(bookings);
      const title = config.title;
      const description = `Visitor: ${name}\nReach: ${reach}\nAdd this to ${config.calendar_name}.`;
      const ics = makeIcs({
        start,
        end,
        title,
        description,
        organizer: FORM_TO,
        attendee: reach.includes("@") ? { name, email: reach } : null,
      });
      const google = googleTemplateUrl({ start, end, title, details: description });
      const text = `Cerebral Frame talk request\n\n${description}\n\nStart: ${start}\nEnd: ${end}\nGoogle: ${google}\n\nAdd the .ics to ${config.calendar_name} (overlay on the main calendar).`;
      await maybeEmail(`Cerebral Frame talk — ${name}`, text, [
        { filename: "talk.ics", content: Buffer.from(ics).toString("base64") },
      ]).catch(() => ({ emailed: false }));
      return send(res, 200, JSON.stringify({ ok: true, google }), "application/json; charset=utf-8");
    } catch {
      return send(res, 400, JSON.stringify({ ok: false }), "application/json; charset=utf-8");
    }
  }

  if (req.method === "POST" && url.pathname === "/api/note") {
    try {
      const name = String(url.searchParams.get("name") || "").trim().slice(0, 120);
      const reach = String(url.searchParams.get("reach") || "").trim().slice(0, 120);
      if (!name || !reach) return send(res, 400, JSON.stringify({ ok: false }), "application/json; charset=utf-8");
      const buf = await readBuffer(req, 12 * 1024 * 1024);
      if (!buf.length) return send(res, 400, JSON.stringify({ ok: false }), "application/json; charset=utf-8");
      const id = crypto.randomBytes(8).toString("hex");
      const token = crypto.randomBytes(16).toString("hex");
      const type = (req.headers["content-type"] || "video/mp4").split(";")[0];
      const ext = type.includes("webm") ? "webm" : "mp4";
      const dir = path.join(DATA, "notes");
      fs.mkdirSync(dir, { recursive: true });
      const file = `${id}.${ext}`;
      fs.writeFileSync(path.join(dir, file), buf);
      fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify({ id, token, name, reach, type, file, at: new Date().toISOString() }, null, 2));
      const watch = `${SITE_URL}/api/note/${id}?token=${token}`;
      await maybeEmail(
        `Cerebral Frame video note — ${name}`,
        `Visitor: ${name}\nReach: ${reach}\nWatch (private): ${watch}\nDo not post this link.`,
      ).catch(() => ({ emailed: false }));
      return send(res, 200, JSON.stringify({ ok: true }), "application/json; charset=utf-8");
    } catch {
      return send(res, 400, JSON.stringify({ ok: false }), "application/json; charset=utf-8");
    }
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
