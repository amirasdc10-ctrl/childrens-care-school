/* Who may see which students. Admin/teacher: all. Student: self. Parent: their children. */
const db = require("./db");
const STAFF = ["admin", "teacher"];
function visibleStudents(user) {
  const all = db.get().students;
  if (STAFF.includes(user.role)) return all;
  const ids = user.role === "student" ? [user.studentId] : user.childIds || [];
  return all.filter(s => ids.includes(s.id));
}
module.exports = { STAFF, visibleStudents };
