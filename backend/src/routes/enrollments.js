/* Enrolments. Front-end page: enrollment.html */
const db = require("../db"), { HttpError } = require("../util"), { visibleStudents } = require("../access");
module.exports = [
  { method: "GET", path: "/api/enrollments", roles: "any", handler: ({ user }) => {
    const d = db.get(), out = {};
    visibleStudents(user).forEach(s => { if (d.enrollments[s.id]) out[s.id] = d.enrollments[s.id]; });
    return out;
  } },
  { method: "PUT", path: "/api/enrollments/:studentId", roles: "any", handler: ({ user, params, body }) => {
    const d = db.get();
    if (!visibleStudents(user).some(s => s.id === params.studentId)) throw new HttpError(403, "You can only change enrolments for your own students.");
    const ids = body.courseIds;
    if (!Array.isArray(ids) || ids.length > 20 || new Set(ids).size !== ids.length || !ids.every(id => d.courses.some(c => c.id === id)))
      throw new HttpError(422, "Choose valid, unique courses.", { courseIds: "Invalid course list." });
    d.enrollments[params.studentId] = ids; db.save();
  } }
];
