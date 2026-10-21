/* Admissions enquiries. Front-end page: contact.html. Public to submit, admin to read. */
const db = require("../db"), { HttpError, rateLimit, isEmail } = require("../util");
const GRADES = ["Grade 6", "Grade 7", "Grade 8"];
module.exports = [
  { method: "POST", path: "/api/enquiries", handler: ({ body, ip }) => {
    rateLimit("enquiry:" + ip, 5, 3600e3);
    const f = {}, s = k => (typeof body[k] === "string" ? body[k].trim() : "");
    if (s("name").length < 2 || s("name").length > 80) f.name = "Please enter your name (2 to 80 characters).";
    if (!isEmail(s("email"))) f.email = "Please enter a valid email address.";
    if (!/^[0-9+ ]{10,15}$/.test(s("phone"))) f.phone = "Enter 10 to 15 digits, for example 98765 43210.";
    if (!GRADES.includes(s("grade"))) f.grade = "Please choose a grade.";
    if (s("message").length < 10 || s("message").length > 1000) f.message = "Please write 10 to 1000 characters.";
    if (Object.keys(f).length) throw new HttpError(422, "Please fix the highlighted fields.", f);
    db.get().enquiries.push({ id: "q" + Date.now(), at: new Date().toISOString(), name: s("name"), email: s("email"), phone: s("phone"), grade: s("grade"), message: s("message") });
    db.save();
  } },
  { method: "GET", path: "/api/enquiries", roles: ["admin"], handler: () => db.get().enquiries }
];
