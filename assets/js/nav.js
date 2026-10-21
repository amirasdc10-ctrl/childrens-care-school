/* Injects the shared navbar and footer from one template, wires the hamburger. */
(function () {
  const LINKS = [["index.html","Home"],["about.html","About"],["courses.html","Courses"],["enrollment.html","Enrol"],["attendance.html","Attendance"],["dashboard.html","Dashboard"],["contact.html","Contact"]];
  const page = location.pathname.split("/").pop() || "index.html";
  const logo = '<img src="assets/img/logo.svg" alt="" width="36" height="36">';
  const svg = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">${p}</svg>`;
  const links = LINKS.map(l => `<li><a class="nav__link" href="${l[0]}"${l[0] === page ? ' aria-current="page"' : ""}>${l[1]}</a></li>`).join("");

  const session = Store.get("auth");
  const authLi = session ? `<li><a class="nav__link" href="#" data-logout>Logout (${CCS.esc(session.name)})</a></li>` : `<li><a class="nav__link" href="login.html"${page === "login.html" ? ' aria-current="page"' : ""}>Login</a></li>`;

  const header = `<header class="nav"><div class="container nav__inner">
    <a class="nav__brand" href="index.html">${logo}<span>${CONFIG.name}</span></a>
    <ul class="nav__links" id="nav-links">${links}${authLi}</ul>
    <div class="nav__actions">
      <button class="icon-btn" data-theme-toggle type="button" aria-label="Toggle colour theme">
        <span class="theme-icon--moon">${svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>')}</span>
        <span class="theme-icon--sun">${svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>')}</span>
      </button>
      <button class="icon-btn nav__burger" id="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">${svg('<path d="M4 7h16M4 12h16M4 17h16"/>')}</button>
    </div></div></header>`;

  const footer = `<footer class="footer"><div class="container"><div class="footer__grid">
    <div><h3>${CONFIG.name}</h3><p>${CONFIG.tagline}.</p></div>
    <div><h3>Explore</h3><ul>${LINKS.slice(0, 4).map(l => `<li><a href="${l[0]}">${l[1]}</a></li>`).join("")}</ul></div>
    <div><h3>Visit us</h3><p>${CONFIG.address}<br>${CONFIG.hours}<br><a href="mailto:${CONFIG.email}">${CONFIG.email}</a><br>${CONFIG.phone}</p></div>
    </div><div class="footer__legal">© ${new Date().getFullYear()} ${CONFIG.name}. All rights reserved.</div></div></footer>`;

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("site-header").innerHTML = header;
    document.getElementById("site-footer").innerHTML = footer;
    const b = document.getElementById("burger"), l = document.getElementById("nav-links");
    const toggle = open => { l.dataset.open = open; b.setAttribute("aria-expanded", open); b.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
    b.addEventListener("click", () => toggle(l.dataset.open !== "true"));
    document.addEventListener("click", e => { if (e.target.closest("[data-logout]")) { e.preventDefault(); Api.logout(); location.href = "index.html"; } });
    document.addEventListener("keydown", e => e.key === "Escape" && toggle(false));
  });
})();
