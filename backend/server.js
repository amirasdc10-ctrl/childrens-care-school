/* Children's Care School server: JSON API under /api plus static hosting of the front-end.
   Run: node backend/server.js  (Node 18+, no npm install needed). */
const http = require("http"), fs = require("fs"), path = require("path");
const cfg = require("./src/config"), auth = require("./src/auth"), db = require("./src/db"), { HttpError } = require("./src/util");

/* Routes in the same order as the front-end pages */
const routes = [].concat(
  require("./src/routes/students"), require("./src/routes/courses"), require("./src/routes/enrollments"),
  require("./src/routes/attendance"), require("./src/routes/dashboard"), require("./src/routes/auth"), require("./src/routes/enquiries")
);
routes.unshift({ method: "GET", path: "/api/health", handler: () => ({ ok: true, name: "childrens-care-school-api" }) });
routes.forEach(r => {
  r.keys = [];
  r.re = new RegExp("^" + r.path.replace(/:(\w+)/g, (_, k) => { r.keys.push(k); return "([^/]+)"; }) + "/?$");
});

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain" };
const send = (res, status, data) => {
  if (res.headersSent) return;
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
};
const clientIp = req => (cfg.trustProxy && req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0].trim() : req.socket.remoteAddress) || "unknown";

function applyCors(req, res) {
  const allow = cfg.corsOrigin.split(",").map(s => s.trim()), origin = req.headers.origin;
  if (allow.includes("*")) res.setHeader("Access-Control-Allow-Origin", "*");
  else if (origin && allow.includes(origin)) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Vary", "Origin"); }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", c => { raw += c; if (raw.length > 100e3) { reject(new HttpError(413, "Request is too large.")); req.destroy(); } });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(new HttpError(400, "Request body must be valid JSON.")); } });
    req.on("error", reject);
  });
}

async function handleApi(req, res, url) {
  applyCors(req, res);
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  let params = {}, route = null;
  for (const r of routes) {
    const m = r.method === req.method && url.pathname.match(r.re);
    if (m) { route = r; r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]))); break; }
  }
  if (!route) throw new HttpError(404, "Not found.");
  let user = null;
  if (route.roles) {
    const h = req.headers.authorization || "", p = h.startsWith("Bearer ") ? auth.verify(h.slice(7)) : null;
    user = p && db.get().users.find(u => u.id === p.uid);
    if (!user) throw new HttpError(401, "Please sign in to continue.");
    if (Array.isArray(route.roles) && !route.roles.includes(user.role)) throw new HttpError(403, "You do not have permission to do this.");
  }
  const body = req.method === "POST" || req.method === "PUT" ? await readBody(req) : {};
  const out = await route.handler({ req, user, params, body, query: Object.fromEntries(url.searchParams), ip: clientIp(req) });
  send(res, 200, out === undefined ? { ok: true } : out);
}

function serveStatic(req, res, url) {
  let p; try { p = decodeURIComponent(url.pathname); } catch (e) { throw new HttpError(400, "Bad request."); }
  if (p.endsWith("/")) p += "index.html";
  const file = path.normalize(path.join(cfg.staticDir, p)), rel = path.relative(cfg.staticDir, file).split(path.sep);
  // Never expose the backend folder, dotfiles or node_modules
  if (rel[0] === ".." || rel[0] === "backend" || rel[0] === "node_modules" || rel.some(s => s.startsWith("."))) throw new HttpError(404, "Not found.");
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
}

function createServer() {
  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("X-Frame-Options", "SAMEORIGIN"); res.setHeader("Referrer-Policy", "same-origin");
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname.startsWith("/api/")) await handleApi(req, res, url); else serveStatic(req, res, url);
    } catch (e) {
      const s = e.status || 500; if (s === 500) console.error(e);
      applyCors(req, res);
      send(res, s, { ok: false, error: s === 500 ? "Something went wrong on our side." : e.message, fields: e.fields });
    }
  });
}
if (require.main === module) {
  db.get();
  createServer().listen(cfg.port, () => console.log("Children's Care School running at http://localhost:" + cfg.port));
}
module.exports = { createServer };
