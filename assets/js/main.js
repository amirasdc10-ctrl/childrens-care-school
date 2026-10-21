/* Shared utilities (window.CCS): DOM helpers, toasts, scroll reveal, counters, validation, generic renderers, forms. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const money = n => "₹" + Number(n).toLocaleString("en-IN");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function toast(msg, type = "success") {
    const box = $("#toasts"); if (!box) return;
    const t = document.createElement("div");
    t.className = "toast toast--" + type; t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), 3800);
  }

  /* Scroll reveal (call again after rendering new content) */
  function reveal() {
    const els = $$(".reveal:not(.is-visible)");
    if (!("IntersectionObserver" in window)) return els.forEach(e => e.classList.add("is-visible"));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }), { threshold: .12 });
    els.forEach(e => io.observe(e));
  }

  /* Animated counters */
  function counters() {
    $$("[data-count]").forEach(el => {
      const end = +el.dataset.count, suffix = el.dataset.suffix || "";
      const run = () => {
        if (reduced) return (el.textContent = end + suffix);
        const t0 = performance.now();
        (function step(t) { const p = Math.min((t - t0) / 1400, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix; if (p < 1) requestAnimationFrame(step); })(t0);
      };
      if (!("IntersectionObserver" in window)) return run();
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { run(); io.disconnect(); } }); io.observe(el);
    });
  }

  /* Client-side validation: reads native attributes (required, type, minlength, pattern + data-msg) */
  function validateForm(form) {
    let ok = true;
    $$("input,select,textarea", form).forEach(f => {
      if (f.type === "radio" || !f.name) return;
      const v = f.value.trim(), box = f.closest(".field"), err = box && $(".field__error", box); let m = "";
      if (f.required && !v) m = "This field is required.";
      else if (v && f.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) m = "Please enter a valid email address, like name@example.com.";
      else if (v && f.minLength > 0 && v.length < f.minLength) m = "Please enter at least " + f.minLength + " characters.";
      else if (v && f.pattern && !new RegExp("^(?:" + f.pattern + ")$").test(v)) m = f.dataset.msg || "Please check this value.";
      if (err) err.textContent = m;
      f.setAttribute("aria-invalid", m ? "true" : "false");
      if (m) ok = false;
    });
    if (!ok) { const bad = $("[aria-invalid='true']", form); bad && bad.focus(); }
    return ok;
  }

  /* Generic content renderers for [data-render] containers */
  const T = {
    facilities: () => FACILITIES.map(f => `<article class="card reveal"><div class="feature__mark" aria-hidden="true">${esc(f[0][0])}</div><h3>${esc(f[0])}</h3><p class="muted">${esc(f[1])}</p></article>`).join(""),
    testimonials: () => TESTIMONIALS.map(t => `<figure class="card reveal" style="margin:0"><blockquote class="quote" style="margin:0 0 1rem">“${esc(t[0])}”</blockquote><figcaption class="quote__by">${esc(t[1])}</figcaption></figure>`).join(""),
    events: () => EVENTS.map(e => `<article class="card event reveal"><div class="event__date">${esc(e[0])}<br><small>${esc(e[1])}</small></div><div><h3>${esc(e[2])}</h3><p class="muted" style="margin:0">${esc(e[3])}</p></div></article>`).join(""),
    faculty: () => FACULTY.map(f => `<article class="card reveal"><div class="avatar" aria-hidden="true">${esc(f[0].split(" ").slice(-2).map(w => w[0]).join(""))}</div><h3>${esc(f[0])}</h3><p class="muted" style="margin:0">${esc(f[1])}</p></article>`).join(""),
    timeline: () => TIMELINE.map(t => `<li class="timeline__item reveal"><div class="timeline__year">${esc(t[0])}</div><p style="margin:0">${esc(t[1])}</p></li>`).join("")
  };

  document.addEventListener("DOMContentLoaded", () => {
    $$("[data-render]").forEach(el => { el.innerHTML = T[el.dataset.render](); });
    $$("[data-config]").forEach(el => { el.textContent = CONFIG[el.dataset.config]; });
    document.title = document.title.replace("Children's Care School", CONFIG.name);

    /* Validated forms: contact and login */
    $$("form[data-validate]").forEach(form => {
      form.noValidate = true;
      form.addEventListener("blur", e => e.target.name && validateForm(form), true);
      form.addEventListener("submit", async e => {
        e.preventDefault();
        if (!validateForm(form)) return toast("Please fix the highlighted fields.", "error");
        const d = Object.fromEntries(new FormData(form));
        try {
          if (form.dataset.validate === "contact") {
            await Api.submitEnquiry(d); toast("Thank you. Our admissions team will reply within 2 working days.");
          } else {
            const r = await Api.login(d.role, d.email, d.password);
            if (r.demo) return toast("Demo mode: no backend is running, so no real sign-in happened.");
            Store.set("auth", { token: r.token, role: r.role, name: r.name, email: r.email });
            const next = new URLSearchParams(location.search).get("next");
            toast("Welcome, " + r.name + ".");
            setTimeout(() => { location.href = /^[a-z]+\.html$/.test(next || "") ? next : (r.role === "admin" || r.role === "teacher" ? "dashboard.html" : "enrollment.html"); }, 700);
            return;
          }
        } catch (err) {
          (err.fields ? Object.entries(err.fields) : []).forEach(([k, msg]) => { const f = form.elements[k], box = f && f.closest(".field"); if (box) { $(".field__error", box).textContent = msg; f.setAttribute("aria-invalid", "true"); } });
          return toast(err.message, "error");
        }
        form.reset();
      });
    });
    reveal(); counters();
  });
  window.addEventListener("unhandledrejection", e => toast((e.reason && e.reason.message) || "Something went wrong. Please try again.", "error"));
  window.CCS = { $, $$, esc, money, toast, reveal, validateForm, reduced };
})();
