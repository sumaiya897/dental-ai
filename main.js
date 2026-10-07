const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
const hasGsap = !!(window.gsap && window.ScrollTrigger);
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---- Loader: reveal the page once fonts and the first frame are ready (with a hard fallback) ---- */
(() => {
  let done = false;
  const go = () => { if (done) return; done = true; root.classList.add("ready"); };
  if (reduce) { go(); return; }
  const wait = [document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 900))];
  Promise.all(wait).then(go);
  setTimeout(go, 3000);
})();

/* ---- Seamless background loop: second video fades in before the first ends ---- */
(() => {
  const vids = $$(".hero__media video");
  if (vids.length < 2) return;
  const [a, b] = vids;
  const FADE = 0.9;
  let cur = a, next = b, swapping = false, raf = 0;
  const play = v => v.play().catch(() => {});
  function swap() {
    swapping = true;
    next.currentTime = 0; play(next);
    next.classList.add("is-active"); cur.classList.remove("is-active");
    const old = cur;
    setTimeout(() => { old.pause(); old.currentTime = 0; }, FADE * 1000 + 100);
    [cur, next] = [next, cur];
    swapping = false;
  }
  const tick = () => { if (cur.duration && !swapping && cur.currentTime >= cur.duration - FADE - 0.1) swap(); raf = requestAnimationFrame(tick); };
  const start = () => { play(a); if (reduce) { a.loop = true; return; } raf = requestAnimationFrame(tick); };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); cur.pause(); }
    else { play(cur); if (!reduce) raf = requestAnimationFrame(tick); }
  });
  a.readyState >= 3 ? start() : a.addEventListener("canplay", start, { once: true });
})();

/* ---- Smooth scroll (Lenis) + anchor handling ---- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  if (hasGsap) { lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
}
$$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
  const id = a.getAttribute("href");
  const t = id === "#top" ? 0 : $(id);
  if (t === null || t === undefined) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(t, { offset: id === "#top" ? 0 : -24, duration: 1.6 });
  else (t === 0 ? window.scrollTo({ top: 0, behavior: "smooth" }) : t.scrollIntoView({ behavior: "smooth" }));
}));

/* ---- Reveals ---- */
(() => {
  const els = $$(".reveal");
  if (reduce || !("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  els.forEach(e => io.observe(e));
})();

/* ---- Mobile menu ---- */
(() => {
  const btn = $(".burger"), menu = $("#menu"), nav = $(".nav");
  const set = open => {
    btn.setAttribute("aria-expanded", open); btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("open", open); nav.classList.toggle("over-menu", open);
    if (lenis) open ? lenis.stop() : lenis.start(); else document.body.style.overflow = open ? "hidden" : "";
  };
  btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach(a => a.addEventListener("click", () => set(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
})();

/* ---- Cursor spotlight on bezels, hero glow ---- */
if (fine) {
  $$("[data-spot]").forEach(el => el.addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", e.clientX - r.left + "px"); el.style.setProperty("--my", e.clientY - r.top + "px");
  }));
  const hero = $(".hero");
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--gx", e.clientX - r.left + "px"); hero.style.setProperty("--gy", e.clientY - r.top + "px");
  });
}

/* ---- Team accordion ---- */
(() => {
  const strips = $$(".strip");
  const on = s => strips.forEach(x => { x.classList.toggle("active", x === s); x.setAttribute("aria-expanded", x === s); });
  strips.forEach(s => {
    s.addEventListener("mouseenter", () => { if (fine) on(s); });
    s.addEventListener("click", () => on(s));
    s.addEventListener("focus", () => on(s));
  });
})();

/* ---- Whitening simulation: recolours only tooth-coloured pixels of the same photo ---- */
(() => {
  const cv = $("#after-canvas"); if (!cv) return;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  const chips = $$(".chip"), label = $("#after-label");
  let base = null, mask = null, w = 0, h = 0, cur = 1, target = 1, raf = 0;
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function buildMask() {
    const d = base.data; mask = new Float32Array(w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), df = mx - mn;
      if (df === 0) continue;
      let hue = mx === r ? ((g - b) / df) % 6 : mx === g ? (b - r) / df + 2 : (r - g) / df + 4;
      hue = (hue * 60 + 360) % 360;
      const s = df / mx, v = mx;
      mask[p] = ss(26, 34, hue) * (1 - ss(66, 76, hue)) * ss(0.16, 0.26, s) * (1 - ss(0.75, 0.9, s)) * ss(0.45, 0.58, v);
    }
  }
  function render(s) {
    const out = ctx.createImageData(w, h), o = out.data, d = base.data;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      const k = mask[p] * s;
      if (k > 0.004) {
        const l = 0.3 * r + 0.59 * g + 0.11 * b, ds = 0.85 * k, br = 0.4 * k;
        r += (l - r) * ds; g += (l - g) * ds; b += (l - b) * ds;
        r += (255 - r) * br; g += (255 - g) * br; b += (255 - b) * br;
      }
      o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }
  function animate() {
    cancelAnimationFrame(raf);
    const from = cur, t0 = performance.now(), dur = reduce ? 0 : 700;
    const step = now => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      cur = from + (target - from) * e; render(cur);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  chips.forEach(ch => ch.addEventListener("click", () => {
    chips.forEach(x => x.classList.toggle("is-on", x === ch));
    target = parseFloat(ch.dataset.level); label.textContent = ch.dataset.label;
    if (base) animate();
  }));

  const img = new Image();
  img.onload = () => {
    w = cv.width = Math.min(1100, img.naturalWidth); h = cv.height = Math.round(w * img.naturalHeight / img.naturalWidth);
    ctx.drawImage(img, 0, 0, w, h); base = ctx.getImageData(0, 0, w, h); buildMask(); cur = target; render(cur);
  };
  img.src = "assets/photos/stained.jpg";
})();

/* ---- Before / after ---- */
(() => {
  const box = $("#compare"); if (!box) return;
  const input = $("input", box);
  const set = v => box.style.setProperty("--p", v + "%");
  input.addEventListener("input", () => set(input.value));
  set(50);
  // gentle intro sweep so the control reads as interactive
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return; io.disconnect();
      const t0 = performance.now(); let touched = false;
      input.addEventListener("pointerdown", () => touched = true, { once: true });
      const step = now => {
        if (touched) return;
        const k = Math.min(1, (now - t0) / 2200);
        const v = 50 + Math.sin(k * Math.PI * 2) * 22 * (1 - k);
        input.value = v; set(v);
        if (k < 1) requestAnimationFrame(step);
      };
      setTimeout(() => requestAnimationFrame(step), 700);
    }, { threshold: 0.6 });
    io.observe(box);
  }
})();

/* ---- Booking form (front-end demo) ---- */
(() => {
  const form = $("#book-form"); if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    $("#done-name").textContent = form.elements.name.value.trim().split(" ")[0];
    form.closest(".form").classList.add("sent");
  });
})();

/* ---- Count-up numbers ---- */
function countUp(el) {
  const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, sep = !!el.dataset.sep;
  if (reduce) return;
  const o = { v: 0 };
  const fmt = v => sep ? Math.round(v).toLocaleString("en-US") : v.toFixed(dec);
  el.textContent = fmt(0);
  gsap.to(o, { v: end, duration: 2.2, ease: "power3.out", onUpdate: () => el.textContent = fmt(o.v) });
}

/* ---- GSAP scroll choreography ---- */
if (hasGsap && !reduce) {
  gsap.registerPlugin(ScrollTrigger);

  // Progress bar
  gsap.to(".progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });

  // Hero: video drifts and scales while copy lifts away (depth)
  gsap.to(".hero__media", { scale: 1.18, yPercent: 8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__inner", { yPercent: -18, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true } });

  // Nav hides on scroll down, returns on scroll up
  const nav = $(".nav");
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: s => { if (s.scroll() < 200) nav.classList.remove("hide"); else nav.classList.toggle("hide", s.direction === 1 && !$(".menu.open")); } });

  // Statement: words light up with scroll
  const p = $("[data-words]");
  if (p) {
    const nodes = [...p.childNodes];
    p.textContent = "";
    nodes.forEach(n => {
      const hl = n.nodeType === 1 && n.classList.contains("hl");
      n.textContent.split(/(\s+)/).forEach(tok => {
        if (!tok.trim()) { p.append(tok); return; }
        const w = document.createElement("span"); w.className = "w" + (hl ? " hl" : ""); w.textContent = tok; p.append(w);
      });
    });
    gsap.fromTo($$(".w", p), { opacity: 0.14 }, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 45%", scrub: true } });
  }

  // Stats count up
  $$("[data-count]").forEach(el => ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => countUp(el) }));

  // Treatment tiles: subtle parallax inside image tiles
  $$(".tile--img .core").forEach(c => gsap.fromTo(c, { backgroundPositionY: "40%" }, { backgroundPositionY: "60%", ease: "none", scrollTrigger: { trigger: c, start: "top bottom", end: "bottom top", scrub: true } }));

  // Approach: rail fills, active step highlights
  if (matchMedia("(min-width: 900px)").matches) {
    const steps = $$(".step");
    gsap.to(".rail i", { scaleY: 1, ease: "none", scrollTrigger: { trigger: "#steps", start: "top 55%", end: "bottom 65%", scrub: true } });
    steps.forEach(s => ScrollTrigger.create({ trigger: s, start: "top 62%", end: "bottom 38%", toggleClass: { targets: s, className: "on" } }));
  } else { $$(".step").forEach(s => s.classList.add("on")); }

  // Team strips cascade in
  gsap.from(".strip", { yPercent: 14, opacity: 0, stagger: 0.12, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".strips", start: "top 80%", once: true } });

  // Closing CTA parallax
  gsap.fromTo(".closer__bg", { yPercent: -10, scale: 1.05 }, { yPercent: 10, scale: 1.2, ease: "none", scrollTrigger: { trigger: ".closer", start: "top bottom", end: "bottom top", scrub: true } });

  // Footer wordmark rises
  gsap.from(".bigmark", { yPercent: 35, opacity: 0, ease: "none", scrollTrigger: { trigger: "footer", start: "top 90%", end: "bottom bottom", scrub: true } });

  // Active nav link
  const links = $$(".nav__links a");
  links.forEach(a => { const t = $(a.getAttribute("href")); if (t) ScrollTrigger.create({ trigger: t, start: "top 50%", end: "bottom 50%", onToggle: s => a.classList.toggle("on", s.isActive) }); });

  // Magnetic buttons
  if (fine) $$("[data-magnetic]").forEach(b => {
    const x = gsap.quickTo(b, "x", { duration: 0.6, ease: "power3" }), y = gsap.quickTo(b, "y", { duration: 0.6, ease: "power3" });
    b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.35); });
    b.addEventListener("pointerleave", () => { x(0); y(0); });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
} else {
  $$(".step").forEach(s => s.classList.add("on"));
}
