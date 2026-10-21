/* Loads backend/.env (if present) and exposes settings. No external packages needed. */
const fs = require("fs"), path = require("path");
const envFile = path.join(__dirname, "..", ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const cfg = {
  port: +process.env.PORT || 3000,
  secret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  tokenHours: +process.env.TOKEN_HOURS || 8,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  trustProxy: process.env.TRUST_PROXY === "1",
  dataFile: path.resolve(__dirname, "..", process.env.DATA_FILE || "data/db.json"),
  staticDir: path.resolve(__dirname, "..", "..") // the front-end lives one level above /backend
};
if (process.env.NODE_ENV === "production" && cfg.secret === "dev-only-secret-change-me") {
  console.error("Refusing to start: set JWT_SECRET in production."); process.exit(1);
}
module.exports = cfg;
