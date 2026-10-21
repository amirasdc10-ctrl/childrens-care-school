/* Enrolment: choose a student, tick courses, live summary, save, and an enrolment table. */
(function () {
  const { $, esc, money, toast } = CCS;
  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await Api.guard())) return;
    const [students, courses] = await Promise.all([Api.getStudents(), Api.getCourses()]);
    let enrol = await Api.getEnrollments();
    const sel = $("#student"), list = $("#course-list"), sum = $("#summary"), btn = $("#confirm");
    sel.innerHTML = '<option value="">Select a student</option>' + students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");

    const chosen = () => Array.from(list.querySelectorAll("input:checked")).map(i => i.value);
    function summary() {
      const cs = courses.filter(c => chosen().includes(c.id));
      sum.innerHTML = cs.length ? "<ul>" + cs.map(c => `<li>${esc(c.title)}</li>`).join("") + "</ul>" : '<p class="muted">No courses selected yet.</p>';
      $("#credits").textContent = cs.reduce((a, c) => a + c.credits, 0);
      $("#fees").textContent = money(cs.reduce((a, c) => a + c.fee, 0));
      btn.disabled = !sel.value;
    }
    function draw() {
      const mine = enrol[sel.value] || [];
      list.innerHTML = courses.map(c => `<label class="card pick"><input type="checkbox" value="${c.id}" ${mine.includes(c.id) ? "checked" : ""} ${sel.value ? "" : "disabled"}>
        <span><strong>${esc(c.title)}</strong><br><small class="muted">Grade ${esc(c.grade)} · ${c.credits} credits · ${money(c.fee)}</small></span></label>`).join("");
      summary();
    }
    function table() {
      $("#enrol-rows").innerHTML = students.map(s => {
        const names = (enrol[s.id] || []).map(id => (courses.find(c => c.id === id) || {}).title).filter(Boolean);
        return `<tr><td>${esc(s.name)}</td><td>${names.length ? names.map(esc).join(", ") : '<span class="muted">Not enrolled</span>'}</td></tr>`;
      }).join("");
    }
    sel.addEventListener("change", draw);
    list.addEventListener("change", summary);
    btn.addEventListener("click", async () => {
      if (!sel.value) return toast("Choose a student first.", "error");
      const ok = await Api.saveEnrollment(sel.value, chosen()); // BACKEND INTEGRATION POINT
      enrol = await Api.getEnrollments(); table();
      toast(ok ? "Enrolment saved." : "Saved for this session only (browser storage is blocked).", ok ? "success" : "error");
    });
    draw(); table();
  });
})();
