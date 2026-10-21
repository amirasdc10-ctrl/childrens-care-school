/* Course catalogue (public). Front-end page: courses.html, index.html */
const db = require("../db");
module.exports = [{ method: "GET", path: "/api/courses", handler: () => db.get().courses }];
