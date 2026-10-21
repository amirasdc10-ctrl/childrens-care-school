/* Dashboard numbers. Front-end page: dashboard.html. Admin/teacher only. */
const db = require("../db"), { STAFF } = require("../access");
module.exports = [{ method: "GET", path: "/api/dashboard", roles: STAFF, handler: () => {
  const d = db.get(), byDate = {};
  Object.entries(d.attendance).forEach(([k, rec]) => { const day = k.split("|")[0]; (byDate[day] = byDate[day] || []).push(...Object.values(rec)); });
  const trend = Object.keys(byDate).sort().slice(-14).map(date => ({ date, percent: Math.round(byDate[date].filter(x => x !== "absent").length / byDate[date].length * 100) }));
  return {
    students: d.students.length, courses: d.courses.length,
    enrolments: Object.values(d.enrollments).reduce((a, v) => a + v.length, 0),
    latest: trend.length ? trend[trend.length - 1].percent : null, trend
  };
} }];
