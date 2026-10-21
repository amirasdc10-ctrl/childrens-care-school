/* Data layer: config, mock data, storage helper and API stubs.
   Every Api.* method is a BACKEND INTEGRATION POINT: swap the body for fetch(). */
const CONFIG = {
  name: "Children's Care School",
  tagline: "Where every child is known, nurtured and inspired",
  email: "admissions@childrenscare.example",
  phone: "+91 00000 00000",
  address: "12 Garden Road, Kanpur, Uttar Pradesh, India",
  hours: "Mon to Sat, 8:30 am to 4:00 pm",
  // Backend URL. "" = same server (node backend/server.js). On GitHub Pages set your deployed API URL, e.g. "https://your-api.onrender.com".
  // If no backend answers, the site automatically falls back to demo mode (localStorage).
  apiBase: ""
};

const CLASSES = [
  { id: "c6a", name: "Grade 6 – A" }, { id: "c7a", name: "Grade 7 – A" }, { id: "c8a", name: "Grade 8 – A" }
];
const STUDENTS = [
  ["s1","Aarav Sharma","c6a"],["s2","Ananya Verma","c6a"],["s3","Ishaan Gupta","c6a"],["s4","Meera Singh","c6a"],
  ["s5","Kabir Mishra","c7a"],["s6","Diya Tiwari","c7a"],["s7","Rohan Yadav","c7a"],["s8","Saanvi Pandey","c7a"],
  ["s9","Vihaan Dubey","c8a"],["s10","Myra Khan","c8a"],["s11","Arjun Srivastava","c8a"],["s12","Tara Agarwal","c8a"]
].map(([id, name, classId], i) => ({ id, name, classId, roll: (i % 4) + 1 }));

const COURSES = [
  { id:"k1", title:"Foundations of Mathematics", grade:"6", subject:"Mathematics", credits:4, fee:12000, desc:"Number sense, fractions and early algebra taught through puzzles and real-world problems." },
  { id:"k2", title:"Young Scientists Lab", grade:"6", subject:"Science", credits:3, fee:10500, desc:"Hands-on experiments in matter, energy and living things, with a weekly lab session." },
  { id:"k3", title:"Creative Writing & Literature", grade:"7", subject:"English", credits:3, fee:9500, desc:"Storytelling, poetry and close reading that build a confident, expressive voice." },
  { id:"k4", title:"Algebra & Geometry", grade:"7", subject:"Mathematics", credits:4, fee:12500, desc:"Equations, proportion and shapes, building towards formal reasoning." },
  { id:"k5", title:"World History & Civics", grade:"8", subject:"Humanities", credits:3, fee:9000, desc:"How societies grow and govern themselves, explored through projects and debate." },
  { id:"k6", title:"Music & Performing Arts", grade:"6", subject:"Arts", credits:2, fee:8000, desc:"Vocal training, rhythm and stagecraft, with a showcase every term." },
  { id:"k7", title:"Coding & Robotics", grade:"8", subject:"Technology", credits:3, fee:13500, desc:"Block and text coding, sensors and small robots built in teams." },
  { id:"k8", title:"Earth & Environment", grade:"7", subject:"Science", credits:3, fee:10000, desc:"Ecosystems, climate and sustainability, including our own school garden." }
];
const DEFAULT_ENROLLMENTS = { s1:["k1","k2"], s2:["k1","k6"], s5:["k3","k4"], s9:["k5","k7"] };

const FACILITIES = [
  ["Library & Reading Rooms","Over 20,000 titles in quiet, sunlit rooms."],["Science Laboratories","Safe, well-equipped labs for every grade."],
  ["Arts Studio","Painting, pottery and a small theatre."],["Sports Grounds","Fields, a pool and trained coaches."],
  ["Digital Classrooms","Smartboards and a coding lab."],["Care Centre","A nurse and counsellor on site every day."]
];
const TESTIMONIALS = [
  ["My daughter walks in smiling and comes home curious. The teachers truly know her.","Parent, Grade 6"],
  ["The balance of academics, arts and kindness is what we hoped for.","Parent, Grade 8"],
  ["I learned that asking questions is the best part of school.","Student, Grade 7"]
];
const EVENTS = [
  ["12","Nov","Annual Day Showcase","Music, drama and student exhibitions."],
  ["28","Nov","Parent–Teacher Meeting","Term progress conversations."],
  ["05","Dec","Science Fair","Projects from every grade on display."]
];
const FACULTY = [["Dr. Meenakshi Rao","Head of Sciences"],["Mr. Vikram Nair","Head of Mathematics"],["Ms. Farah Siddiqui","Head of Languages"],["Mr. Arun Kapoor","Director of Arts"]];
const TIMELINE = [["1998","Founded with 40 students and a single classroom."],["2006","Opened the library and science wing."],["2014","Launched the arts and performing studio."],["2022","Introduced coding, robotics and digital classrooms."]];

/* Storage helper: localStorage with in-memory fallback so the site never crashes when storage is blocked. */
const Store = (() => {
  const mem = {};
  return {
    get(key, fallback = null) {
      try { const v = localStorage.getItem("ccs:" + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return key in mem ? mem[key] : fallback; }
    },
    set(key, value) {
      mem[key] = value;
      try { localStorage.setItem("ccs:" + key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    remove(key) { delete mem[key]; try { localStorage.removeItem("ccs:" + key); } catch (e) {} }
  };
})();

/* Attendance: deterministic seeded history (demo mode) merged with saved records. Key = "YYYY-MM-DD|classId".
   In server mode Api.getAttendance() fills `cache` with the server's records. */
const Attendance = {
  cache: null,
  iso(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); },
  seed() {
    const out = {}; const d = new Date(); let n = 0;
    for (let back = 1; n < 20 && back < 40; back++) {
      const day = new Date(d); day.setDate(d.getDate() - back);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      n++;
      CLASSES.forEach((c, ci) => {
        const rec = {};
        STUDENTS.filter(s => s.classId === c.id).forEach((s, si) => {
          const k = si * 7 + n * 3 + ci * 5;
          rec[s.id] = k % 11 === 0 ? "absent" : k % 9 === 0 ? "late" : "present";
        });
        out[this.iso(day) + "|" + c.id] = rec;
      });
    }
    return out;
  },
  all() { return this.cache || Object.assign(this.seed(), Store.get("attendance", {})); }
};

/* Dashboard numbers computed locally (demo mode). The server computes the same shape at GET /api/dashboard. */
const Dashboard = {
  compute(students, courses, enrol, att) {
    const by = {};
    Object.entries(att).forEach(([k, rec]) => { const d = k.split("|")[0]; (by[d] = by[d] || []).push(...Object.values(rec)); });
    const trend = Object.keys(by).sort().slice(-14).map(d => ({ date: d, percent: Math.round(by[d].filter(x => x !== "absent").length / by[d].length * 100) }));
    return { students: students.length, courses: courses.length, enrolments: Object.values(enrol).reduce((a, v) => a + v.length, 0), latest: trend.length ? trend[trend.length - 1].percent : null, trend };
  }
};

/* HTTP client: detects the backend once, sends the login token, turns errors into Error objects. */
const Http = {
  online: null,
  async detect() {
    if (this.online !== null) return this.online;
    try {
      const c = new AbortController(), t = setTimeout(() => c.abort(), 2000);
      const r = await fetch(CONFIG.apiBase + "/api/health", { signal: c.signal }); clearTimeout(t);
      this.online = !!((await r.json()).ok);
    } catch (e) { this.online = false; }
    return this.online;
  },
  async call(method, path, body) {
    const auth = Store.get("auth");
    const r = await fetch(CONFIG.apiBase + "/api" + path, {
      method, headers: Object.assign({ "Content-Type": "application/json" }, auth ? { Authorization: "Bearer " + auth.token } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await r.json().catch(() => ({}));
    if (r.status === 401 && auth) Store.remove("auth"); // token expired
    if (!r.ok) { const e = new Error(data.error || "Request failed."); e.status = r.status; e.fields = data.fields; throw e; }
    return data;
  }
};

/* API layer: talks to the backend when it is running, otherwise uses demo mode (localStorage). */
const Api = {
  /* Protects a page in server mode. roles = allowed roles (omit for any signed-in user). */
  async guard(roles) {
    if (!(await Http.detect())) return true;
    const a = Store.get("auth");
    if (!a || (roles && !roles.includes(a.role))) { location.href = "login.html?next=" + encodeURIComponent(location.pathname.split("/").pop()); return false; }
    return true;
  },
  async getStudents() { return (await Http.detect()) ? Http.call("GET", "/students") : STUDENTS; },
  async getCourses() { return (await Http.detect()) ? Http.call("GET", "/courses") : COURSES; },
  async getEnrollments() { return (await Http.detect()) ? Http.call("GET", "/enrollments") : Store.get("enrollments", DEFAULT_ENROLLMENTS); },
  async saveEnrollment(studentId, courseIds) {
    if (await Http.detect()) { await Http.call("PUT", "/enrollments/" + studentId, { courseIds }); return true; }
    const all = Store.get("enrollments", DEFAULT_ENROLLMENTS); all[studentId] = courseIds; return Store.set("enrollments", all);
  },
  async getAttendance() {
    Attendance.cache = (await Http.detect()) ? await Http.call("GET", "/attendance") : null;
    return Attendance.all();
  },
  async saveAttendance(date, classId, records) {
    if (await Http.detect()) { await Http.call("POST", "/attendance", { date, classId, records }); await this.getAttendance(); return true; }
    const all = Store.get("attendance", {}); all[date + "|" + classId] = records; return Store.set("attendance", all);
  },
  async getDashboard() {
    if (await Http.detect()) return Http.call("GET", "/dashboard");
    return Dashboard.compute(STUDENTS, COURSES, await this.getEnrollments(), await this.getAttendance());
  },
  async submitEnquiry(data) {
    if (await Http.detect()) return Http.call("POST", "/enquiries", data);
    const all = Store.get("enquiries", []); all.push(Object.assign({ at: Date.now() }, data)); Store.set("enquiries", all); return { ok: true };
  },
  async login(role, email, password) {
    if (await Http.detect()) return Http.call("POST", "/auth/login", { role, email, password });
    return { ok: true, role, email, demo: true };
  },
  logout() { Store.remove("auth"); }
};
