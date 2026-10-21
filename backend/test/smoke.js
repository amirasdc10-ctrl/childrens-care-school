/* End-to-end smoke test: node test/smoke.js (uses a temporary database). */
const os = require("os"), path = require("path"), assert = require("assert");
process.env.DATA_FILE = path.join(os.tmpdir(), "ccs-test-" + Date.now() + ".json");
const { createServer } = require("../server");
const server = createServer();
server.listen(0, async () => {
  const base = "http://localhost:" + server.address().port;
  const call = async (method, p, body, token) => {
    const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const text = await r.text(); let data; try { data = JSON.parse(text); } catch (e) { data = text; }
    return { status: r.status, data };
  };
  const login = async (role, email, pw) => (await call("POST", "/api/auth/login", { role, email, password: pw })).data.token;
  try {
    assert.equal((await call("GET", "/api/health")).data.ok, true);
    assert.equal((await call("GET", "/api/courses")).data.length, 8);
    assert.equal((await call("GET", "/api/students")).status, 401);
    assert.equal((await call("POST", "/api/auth/login", { role: "teacher", email: "teacher@childrenscare.example", password: "wrong" })).status, 401);
    const teacher = await login("teacher", "teacher@childrenscare.example", "Teacher@123");
    assert.equal((await call("GET", "/api/students", null, teacher)).data.length, 12);
    const roster = Object.fromEntries(["s1", "s2", "s3", "s4"].map(id => [id, "present"])); roster.s2 = "late";
    assert.equal((await call("POST", "/api/attendance", { date: "2026-01-05", classId: "c6a", records: roster }, teacher)).status, 200);
    assert.equal((await call("POST", "/api/attendance", { date: "2026-01-05", classId: "c6a", records: { s1: "present" } }, teacher)).status, 422);
    assert.equal((await call("GET", "/api/attendance", null, teacher)).data["2026-01-05|c6a"].s2, "late");
    assert.ok((await call("GET", "/api/dashboard", null, teacher)).data.trend.length > 0);
    const student = await login("student", "student@childrenscare.example", "Student@123");
    assert.equal((await call("GET", "/api/students", null, student)).data.length, 1);
    assert.equal((await call("POST", "/api/attendance", { date: "2026-01-05", classId: "c6a", records: roster }, student)).status, 403);
    assert.equal((await call("PUT", "/api/enrollments/s5", { courseIds: ["k1"] }, student)).status, 403);
    assert.equal((await call("PUT", "/api/enrollments/s1", { courseIds: ["k1", "k3"] }, student)).status, 200);
    assert.deepEqual((await call("GET", "/api/enrollments", null, student)).data.s1, ["k1", "k3"]);
    assert.equal((await call("POST", "/api/enquiries", { name: "A", email: "bad" })).status, 422);
    assert.equal((await call("POST", "/api/enquiries", { name: "Asha Rao", email: "asha@example.com", phone: "98765 43210", grade: "Grade 6", message: "Please share the fee details." })).status, 200);
    const admin = await login("admin", "admin@childrenscare.example", "Admin@123");
    assert.equal((await call("GET", "/api/enquiries", null, admin)).data.length, 1);
    assert.equal((await call("GET", "/api/enquiries", null, teacher)).status, 403);
    assert.ok(String((await call("GET", "/index.html")).data).includes("<!DOCTYPE html>"));
    assert.equal((await call("GET", "/backend/server.js")).status, 404);
    console.log("All smoke tests passed.");
  } catch (e) { console.error("FAILED:", e.message); process.exitCode = 1; }
  server.close();
});
