/* Small shared helpers: HttpError, rate limiter and validators. */
class HttpError extends Error {
  constructor(status, message, fields) { super(message); this.status = status; this.fields = fields; }
}
const hits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now(), recent = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); throw new HttpError(429, "Too many attempts. Please wait a while and try again."); }
  recent.push(now); hits.set(key, recent);
}
const isEmail = s => typeof s === "string" && s.length <= 120 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
const isDate = s => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z"); return !isNaN(d) && d.toISOString().slice(0, 10) === s;
};
module.exports = { HttpError, rateLimit, isEmail, isDate };
