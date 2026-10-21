/* Attendance: pick class and date, mark each student, save, and view the monthly summary. */
(function () {
  const { $, $$, esc, toast } = CCS;
  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await Api.guard(["admin", "teacher"]))) return;
    const students = await Api.getStudents();
    await Api.getAttendance();
    const cls = $("#class"), date = $("#date"), roster = $("#roster"), rows = $("#summary-rows");
    cls.innerHTML = CLASSES.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    date.value = Attendance.iso(new Date()); date.max = date.value;
    let marks = {};
    const mine = () => students.filter(s => s.classId === cls.value);

    function counts() {
      const v = Object.values(marks);
      ["present", "absent", "late"].forEach(k => ($("#n-" + k).textContent = v.filter(x => x === k).length));
    }
    function draw() {
      const saved = Attendance.all()[date.value + "|" + cls.value] || {};
      marks = {}; mine().forEach(s => (marks[s.id] = saved[s.id] || "present"));
      roster.innerHTML = mine().map(s => `<div class="roster__row" data-id="${s.id}"><span>${esc(s.name)} <small class="muted">Roll ${s.roll}</small></span>
        <div class="seg" role="group" aria-label="Attendance for ${esc(s.name)}">${["present", "late", "absent"].map(k => `<button type="button" class="seg__btn" data-status="${k}" aria-pressed="${marks[s.id] === k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join("")}</div></div>`).join("");
      counts(); summary();
    }
    function summary() {
      const month = date.value.slice(0, 7), all = Attendance.all();
      rows.innerHTML = mine().map(s => {
        let total = 0, ok = 0;
        Object.entries(all).forEach(([k, rec]) => { const [d, c] = k.split("|"); if (c === cls.value && d.startsWith(month) && rec[s.id]) { total++; if (rec[s.id] !== "absent") ok++; } });
        const p = total ? Math.round(ok / total * 100) : 0;
        return `<tr><td>${esc(s.name)}</td><td>${total ? p + "%" : "No records"}</td><td><div class="progress" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(s.name)} attendance"><div class="progress__bar" style="width:${p}%"></div></div></td></tr>`;
      }).join("");
    }
    roster.addEventListener("click", e => {
      const b = e.target.closest(".seg__btn"); if (!b) return;
      const id = b.closest(".roster__row").dataset.id; marks[id] = b.dataset.status;
      $$(".seg__btn", b.parentNode).forEach(x => x.setAttribute("aria-pressed", x === b)); counts();
    });
    $("#mark-all").addEventListener("click", () => { Object.keys(marks).forEach(k => (marks[k] = "present")); $$(".seg__btn").forEach(b => b.setAttribute("aria-pressed", b.dataset.status === "present")); counts(); toast("Everyone marked present."); });
    $("#submit").addEventListener("click", async () => {
      if (!date.value) return toast("Pick a date first.", "error");
      const ok = await Api.saveAttendance(date.value, cls.value, marks); // BACKEND INTEGRATION POINT
      summary(); toast(ok ? "Attendance saved." : "Saved for this session only (browser storage is blocked).", ok ? "success" : "error");
    });
    cls.addEventListener("change", draw); date.addEventListener("change", draw); draw();
  });
})();
