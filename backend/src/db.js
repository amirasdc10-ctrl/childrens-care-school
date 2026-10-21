/* JSON-file database with atomic writes. This is the ONLY file to replace when moving to PostgreSQL/MongoDB. */
const fs = require("fs"), path = require("path"), cfg = require("./config"), seed = require("./seed");
let db = null;
function save() {
  fs.mkdirSync(path.dirname(cfg.dataFile), { recursive: true });
  const tmp = cfg.dataFile + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, cfg.dataFile); // atomic swap: a crash never leaves a half-written file
}
function get() {
  if (db) return db;
  try { db = JSON.parse(fs.readFileSync(cfg.dataFile, "utf8")); }
  catch (e) {
    if (e.code !== "ENOENT") throw e; // corrupt file: stop instead of overwriting real data
    db = seed.build(); save(); console.log("Created new database with demo data at", cfg.dataFile);
  }
  return db;
}
module.exports = { get, save };
