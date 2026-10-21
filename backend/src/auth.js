/* Password hashing (scrypt) and signed tokens (HMAC-SHA256), using only Node's crypto. */
const crypto = require("crypto"), cfg = require("./config");
const hmac = body => crypto.createHmac("sha256", cfg.secret).update(body).digest("base64url");

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return salt.toString("hex") + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
}
function verifyPassword(pw, stored) {
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(pw, Buffer.from(salt, "hex"), 64), real = Buffer.from(hash, "hex");
  return test.length === real.length && crypto.timingSafeEqual(test, real);
}
function sign(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + cfg.tokenHours * 3600e3 })).toString("base64url");
  return body + "." + hmac(body);
}
function verify(token) {
  try {
    const [body, sig] = String(token).split(".");
    const a = Buffer.from(sig || ""), b = Buffer.from(hmac(body));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch (e) { return null; }
}
module.exports = { hashPassword, verifyPassword, sign, verify };
