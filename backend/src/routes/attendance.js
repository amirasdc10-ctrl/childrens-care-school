/* Attendance. Front-end page: attendance.html. Only admin/teacher can write. */
const db = require("../db"), { HttpError, isDate } = require("../util"), { STAFF, visibleStudents } = require("../access");
const STATUS = ["present", "absent", "late"];
module.exports = [
  { method: "GET", path: "/api/attendance", roles: "any", handler: ({ user }) => {
    const vis = new Set(visibleStudents(user).map(s => s.id)), out = {};
    Object.entries(db.get().attendance).forEach(([key, rec]) => {
      const f = Object.fromEntries(Object.entries(rec).filter(([id]) => vis.has(id)));
      if (Object.keys(f).length) out[key] = f;
    });
    return out;
  } },
  { method: "POST", path: "/api/attendance", roles: STAFF, handler: ({ body }) => {
    const d = db.get(), { date, classId, records } = body;
    if (!isDate(date)) throw new HttpError(422, "Choose a valid date.", { date: "Invalid date." });
    if (new Date(date) > new Date(Date.now() + 864e5)) throw new HttpError(422, "Attendance cannot be marked for a future date.");
    if (!d.classes.some(c => c.id === classId)) throw new HttpError(422, "Choose a valid class.");
    const roster = d.students.filter(s => s.classId === classId).map(s => s.id);
    if (!records || typeof records !== "object" || roster.length !== Object.keys(records).length ||
        !roster.every(id => STATUS.includes(records[id]))) throw new HttpError(422, "Mark every student as present, absent or late.");
    d.attendance[date + "|" + classId] = Object.fromEntries(roster.map(id => [id, records[id]])); db.save();
  } }
];
