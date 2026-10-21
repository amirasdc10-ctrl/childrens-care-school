/* Login. Front-end page: login.html. Role must match the account's role. */
const db = require("../db"), auth = require("../auth"), { HttpError, rateLimit, isEmail } = require("../util");
const DUMMY = auth.hashPassword("not-a-real-password"); // keeps timing similar for unknown emails
module.exports = [
  { method: "POST", path: "/api/auth/login", handler: ({ body, ip }) => {
    rateLimit("login:" + ip, 10, 15 * 60e3);
    const { role, email, password } = body;
    if (!isEmail(email) || typeof password !== "string" || !password) throw new HttpError(422, "Enter your email and password.");
    const u = db.get().users.find(x => x.email === email.trim().toLowerCase());
    const ok = auth.verifyPassword(password, u ? u.password : DUMMY);
    if (!u || !ok || (role && String(role).toLowerCase() !== u.role)) throw new HttpError(401, "Email, password or role is incorrect.");
    return { ok: true, token: auth.sign({ uid: u.id }), role: u.role, name: u.name, email: u.email };
  } },
  { method: "GET", path: "/api/auth/me", roles: "any", handler: ({ user }) => ({ ok: true, role: user.role, name: user.name, email: user.email }) }
];
