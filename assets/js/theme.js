/* Theme toggle. The initial theme is applied by the inline <head> script to avoid a flash. */
(function () {
  const root = document.documentElement;
  function set(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem("ccs:theme", theme); } catch (e) {} // storage may be blocked
    document.querySelectorAll("[data-theme-toggle]").forEach(b => b.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode"));
  }
  document.addEventListener("click", e => {
    if (e.target.closest("[data-theme-toggle]")) set(root.dataset.theme === "dark" ? "light" : "dark");
  });
  document.addEventListener("DOMContentLoaded", () => set(root.dataset.theme || "light"));
})();
