/* Dashboard: KPI cards and a dependency-free SVG attendance trend chart. */
(function () {
  const { $ } = CCS, NS = "http://www.w3.org/2000/svg";
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); p && p.appendChild(e); return e; };
  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await Api.guard(["admin", "teacher"]))) return;
    const data = await Api.getDashboard(); // BACKEND: GET /api/dashboard
    const days = data.trend.map(t => t.date), pct = data.trend.map(t => t.percent);
    $("#k-students").textContent = data.students;
    $("#k-today").textContent = data.latest === null ? "No data" : data.latest + "%";
    $("#k-courses").textContent = data.courses;
    $("#k-enrol").textContent = data.enrolments;

    const W = 640, H = 280, L = 40, R = 16, T = 16, B = 36, svg = $("#chart");
    const x = i => L + (pct.length > 1 ? i * (W - L - R) / (pct.length - 1) : 0), y = v => T + (100 - v) / 100 * (H - T - B);
    [0, 25, 50, 75, 100].forEach(v => { el("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: "chart__grid" }, svg); el("text", { x: 6, y: y(v) + 4 }, svg).textContent = v + "%"; });
    if (!pct.length) return;
    const pts = pct.map((v, i) => x(i) + "," + y(v)).join(" ");
    el("polygon", { points: `${x(0)},${y(0)} ${pts} ${x(pct.length - 1)},${y(0)}`, class: "chart__area" }, svg);
    el("polyline", { points: pts, class: "chart__line", "stroke-linejoin": "round" }, svg);
    pct.forEach((v, i) => {
      const c = el("circle", { cx: x(i), cy: y(v), r: 5, class: "chart__dot" }, svg); el("title", {}, c).textContent = days[i] + ": " + v + "%";
      if (i % 2 === 0 || i === pct.length - 1) el("text", { x: x(i) - 14, y: H - 10 }, svg).textContent = days[i].slice(5);
    });
  });
})();
