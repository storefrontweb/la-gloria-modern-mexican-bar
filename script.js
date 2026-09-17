/* La Gloria Modern Mexican Bar — vanilla JS interactions */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Mobile nav toggle ─────────────────────────────────── */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  function setNav(open) {
    navLinks.classList.toggle("open", open);
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      setNav(!navLinks.classList.contains("open"));
    });
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (navLinks.classList.contains("open")) setNav(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setNav(false);
    });
  }

  /* ── Smooth anchor scrolling ───────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const id = anchor.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });

  /* ── Reveal on scroll ──────────────────────────────────── */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--d", (i % 4) * 0.08 + "s");
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ── Sticky header shadow ──────────────────────────────── */
  const header = document.getElementById("siteHeader");
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 10);
  }
  if (header) {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ── Review slider ─────────────────────────────────────── */
  const track = document.getElementById("reviewTrack");
  const dotsWrap = document.getElementById("reviewDots");
  const prevBtn = document.getElementById("reviewPrev");
  const nextBtn = document.getElementById("reviewNext");

  if (track && dotsWrap) {
    const slides = Array.from(track.children);
    let index = 0;

    const dots = slides.map(function (_, i) {
      const b = document.createElement("button");
      b.className = "dot";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Review " + (i + 1));
      b.addEventListener("click", function () { goTo(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (d, di) {
        d.classList.toggle("active", di === index);
        d.setAttribute("aria-selected", String(di === index));
      });
    }

    let timer = null;
    function start() {
      if (!reduceMotion) timer = setInterval(function () { goTo(index + 1); }, 6000);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); restart(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); restart(); });

    const slider = document.getElementById("reviewsSlider");
    if (slider) {
      slider.addEventListener("mouseenter", stop);
      slider.addEventListener("mouseleave", start);
      slider.addEventListener("focusin", stop);
      slider.addEventListener("focusout", start);
    }

    goTo(0);
    start();
  }

  /* ── Quote form validation ─────────────────────────────── */
  const form = document.getElementById("quote-form");
  if (form) {
    const success = document.getElementById("formSuccess");

    function setError(input, message) {
      const wrap = input.closest(".field");
      const msgEl = wrap.querySelector(".field-error");
      wrap.classList.toggle("has-error", Boolean(message));
      if (msgEl) msgEl.textContent = message || "";
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
      return Boolean(message);
    }

    function validEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      let hasError = false;

      const name = form.querySelector("#q-name");
      const phone = form.querySelector("#q-phone");
      const email = form.querySelector("#q-email");
      const date = form.querySelector("#q-date");
      const guests = form.querySelector("#q-guests");
      const type = form.querySelector("#q-type");
      const msg = form.querySelector("#q-msg");

      hasError = setError(name, name.value.trim() ? "" : "Please tell us your name.") || hasError;

      const digits = phone.value.replace(/\D/g, "");
      const phoneMsg =
        !phone.value.trim()
          ? "Please enter a phone number."
          : digits.length < 10
            ? "Phone number looks too short — enter at least 10 digits."
            : "";
      hasError = setError(phone, phoneMsg) || hasError;

      hasError = setError(
        email,
        !email.value.trim() ? "Please enter your email." : validEmail(email.value.trim()) ? "" : "That email doesn't look right."
      ) || hasError;

      hasError = setError(date, date.value ? "" : "Pick a date so we can hold your table.") || hasError;
      hasError = setError(guests, guests.value ? "" : "Select your party size.") || hasError;
      setError(type, "");

      if (hasError) {
        const firstBad = form.querySelector(".field.has-error input, .field.has-error select");
        if (firstBad) firstBad.focus();
        return;
      }

      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
      }
      form.reset();
    });

    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("input", function () { setError(input, ""); });
      input.addEventListener("change", function () { setError(input, ""); });
    });
  }

  /* ── Current year in footer ────────────────────────────── */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();
})();