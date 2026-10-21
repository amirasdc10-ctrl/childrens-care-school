/* Course cards (shared by home + catalogue), search/filter and details modal. */
(function () {
  const { $, esc, money, reveal } = CCS;
  const card = c => `<article class="card reveal"><p style="margin:0 0 .6rem"><span class="badge">Grade ${esc(c.grade)}</span><span class="badge">${esc(c.subject)}</span></p>
    <h3>${esc(c.title)}</h3><div class="meta"><span>${c.credits} credits</span><span>${money(c.fee)} / term</span></div>
    <button class="btn btn--outline btn--sm" type="button" data-details="${c.id}">View details</button></article>`;
  CCS.courseCard = card;

  document.addEventListener("DOMContentLoaded", async () => {
    const courses = await Api.getCourses(); // BACKEND INTEGRATION POINT
    const feat = $("[data-featured]"), cat = $("[data-catalogue]");
    if (feat) feat.innerHTML = courses.slice(0, 3).map(card).join("");
    if (cat) {
      const q = $("#q"), g = $("#grade"), s = $("#subject"), count = $("#count");
      [...new Set(courses.map(c => c.grade))].sort().forEach(v => g.add(new Option("Grade " + v, v)));
      [...new Set(courses.map(c => c.subject))].sort().forEach(v => s.add(new Option(v, v)));
      const draw = () => {
        const t = q.value.trim().toLowerCase();
        const list = courses.filter(c => (!g.value || c.grade === g.value) && (!s.value || c.subject === s.value) && (!t || (c.title + c.desc).toLowerCase().includes(t)));
        cat.innerHTML = list.length ? list.map(card).join("") : '<p class="muted">No courses match. Try clearing a filter or searching a different word.</p>';
        count.textContent = list.length + " course" + (list.length === 1 ? "" : "s") + " shown";
        reveal();
      };
      [q, g, s].forEach(el => el.addEventListener("input", draw)); draw();
    }
    const dlg = $("#course-dialog");
    document.addEventListener("click", e => {
      const b = e.target.closest("[data-details]"); if (!b || !dlg) return;
      const c = courses.find(x => x.id === b.dataset.details);
      $("#dlg-body").innerHTML = `<h2>${esc(c.title)}</h2><p><span class="badge">Grade ${esc(c.grade)}</span><span class="badge">${esc(c.subject)}</span></p><p>${esc(c.desc)}</p><p><strong>${c.credits} credits</strong> · <strong>${money(c.fee)}</strong> per term</p>`;
      dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
    });
    dlg && dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
    reveal();
  });
})();
