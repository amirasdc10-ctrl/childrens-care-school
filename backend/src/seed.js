/* First-run data. Mirrors the front-end mock data so both modes look the same.
   Demo passwords are listed in README. CHANGE THEM before going live. */
const { hashPassword } = require("./auth");
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

function build() {
  const classes = [{ id: "c6a", name: "Grade 6 – A" }, { id: "c7a", name: "Grade 7 – A" }, { id: "c8a", name: "Grade 8 – A" }];
  const students = [["s1","Aarav Sharma","c6a"],["s2","Ananya Verma","c6a"],["s3","Ishaan Gupta","c6a"],["s4","Meera Singh","c6a"],
    ["s5","Kabir Mishra","c7a"],["s6","Diya Tiwari","c7a"],["s7","Rohan Yadav","c7a"],["s8","Saanvi Pandey","c7a"],
    ["s9","Vihaan Dubey","c8a"],["s10","Myra Khan","c8a"],["s11","Arjun Srivastava","c8a"],["s12","Tara Agarwal","c8a"]]
    .map(([id, name, classId], i) => ({ id, name, classId, roll: (i % 4) + 1 }));
  const courses = [
    ["k1","Foundations of Mathematics","6","Mathematics",4,12000,"Number sense, fractions and early algebra taught through puzzles and real-world problems."],
    ["k2","Young Scientists Lab","6","Science",3,10500,"Hands-on experiments in matter, energy and living things, with a weekly lab session."],
    ["k3","Creative Writing & Literature","7","English",3,9500,"Storytelling, poetry and close reading that build a confident, expressive voice."],
    ["k4","Algebra & Geometry","7","Mathematics",4,12500,"Equations, proportion and shapes, building towards formal reasoning."],
    ["k5","World History & Civics","8","Humanities",3,9000,"How societies grow and govern themselves, explored through projects and debate."],
    ["k6","Music & Performing Arts","6","Arts",2,8000,"Vocal training, rhythm and stagecraft, with a showcase every term."],
    ["k7","Coding & Robotics","8","Technology",3,13500,"Block and text coding, sensors and small robots built in teams."],
    ["k8","Earth & Environment","7","Science",3,10000,"Ecosystems, climate and sustainability, including our own school garden."]
  ].map(([id, title, grade, subject, credits, fee, desc]) => ({ id, title, grade, subject, credits, fee, desc }));

  const attendance = {}; const today = new Date(); let n = 0;
  for (let back = 1; n < 20 && back < 40; back++) {
    const day = new Date(today); day.setDate(today.getDate() - back);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    n++;
    classes.forEach((c, ci) => {
      const rec = {};
      students.filter(s => s.classId === c.id).forEach((s, si) => {
        const k = si * 7 + n * 3 + ci * 5;
        rec[s.id] = k % 11 === 0 ? "absent" : k % 9 === 0 ? "late" : "present";
      });
      attendance[iso(day) + "|" + c.id] = rec;
    });
  }
  const user = (id, role, name, email, pw, extra) => ({ id, role, name, email, password: hashPassword(pw), ...extra });
  return {
    users: [
      user("u1", "admin", "School Admin", "admin@childrenscare.example", "Admin@123"),
      user("u2", "teacher", "Class Teacher", "teacher@childrenscare.example", "Teacher@123"),
      user("u3", "student", "Aarav Sharma", "student@childrenscare.example", "Student@123", { studentId: "s1" }),
      user("u4", "parent", "Parent of Aarav & Ananya", "parent@childrenscare.example", "Parent@123", { childIds: ["s1", "s2"] })
    ],
    classes, students, courses,
    enrollments: { s1: ["k1", "k2"], s2: ["k1", "k6"], s5: ["k3", "k4"], s9: ["k5", "k7"] },
    attendance, enquiries: []
  };
}
module.exports = { build };
