/* Students + classes. Front-end page: enrollment.html, attendance.html */
const db = require("../db"), { visibleStudents } = require("../access");
module.exports = [
  { method: "GET", path: "/api/classes", handler: () => db.get().classes },
  { method: "GET", path: "/api/students", roles: "any", handler: ({ user }) => visibleStudents(user) }
];
