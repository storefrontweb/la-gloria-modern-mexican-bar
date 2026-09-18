document.body.classList.add('js');

/* La Gloria Modern Mexican Bar — interactions */
/* Choreographed hero, scroll reveals, review slider, count-up, form, nav. */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function prefersReduced() { return reducedMotion.matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------------- Hero entrance ---------------- */
  window.requestAnimationFrame(function () {
    document.body.classList.add('loaded');
  });

  /* ---------------- Sticky-header shadow ---------------- */
  var header = document.getElementById('site-header');
  function onScrollShadow() {
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScrollShadow();
  window.addEventListener('scroll', onScrollShadow, { passive: true });

  /* ---------------- Mobile nav ---------------- */
  var navToggle = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');

  function setNavOpen(open) {
    header.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  navToggle.addEventListener('click', function () {
    setNavOpen(!header.classList.contains('open'));
  });

  var navItems = navLinks.querySelectorAll('a');
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].addEventListener('click', function () { setNavOpen(false); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('open')) setNavOpen(false);
  });

  document.addEventListener('click', function (e) {
    if (header.classList.contains('open') && !header.contains(e.target)) setNavOpen(false);
  });

  /* ---------------- Smooth anchor scrolling ---------------- */
  var anchors = document.querySelectorAll('a[href^="#"]');
  for (var a = 0; a < anchors.length; a++) {
    anchors[a].addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
      try { if (history.replaceState) history.replaceState(null, '', id); } catch (err) { /* file:// or sandboxed */ }
    });
  }

  /* ---------------- Scroll reveals ---------------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    for (var r = 0; r < revealEls.length; r++) revealEls[r].classList.add('in-view');
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('in-view');
          revealIO.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    for (var j = 0; j < revealEls.length; j++) revealIO.observe(revealEls[j]);
  }

  /* ---------------- Review slider (tabs + auto-rotate) ---------------- */
  var track = document.getElementById('review-track');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.review-dot'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.review-panel'));
  var sliderWrap = document.getElementById('review-window');
  var sliderIndex = 0;
  var slideTimer = null;
  var lastSwipe = null;

  function goTo(index) {
    sliderIndex = (index + tabs.length) % tabs.length;
    track.style.transform = 'translate3d(-' + (sliderIndex * 100) + '%, 0, 0)';
    for (var i = 0; i < tabs.length; i++) {
      var active = i === sliderIndex;
      tabs[i].setAttribute('aria-selected', active ? 'true' : 'false');
      tabs[i].tabIndex = active ? 0 : -1;
      panels[i].setAttribute('aria-hidden', active ? 'false' : 'true');
    }
  }

  function startAuto() {
    stopAuto();
    if (reducedMotion.matches || document.hidden) return;
    slideTimer = setInterval(function () { goTo(sliderIndex + 1); }, 6000);
  }
  function stopAuto() {
    if (slideTimer) { clearInterval(slideTimer); slideTimer = null; }
  }

  function handleTabClick() { startAuto(); }

  for (var t = 0; t < tabs.length; t++) {
    tabs[t].addEventListener('click', function () {
      goTo(tabs.indexOf(this));
      this.focus();
      handleTabClick();
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('keydown', function (e) {
      var idx = tabs.indexOf(tab);
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(idx - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        goTo(tabs.indexOf(next));
        next.focus();
        startAuto();
      }
    });
  });

  sliderWrap.addEventListener('mouseenter', stopAuto);
  sliderWrap.addEventListener('mouseleave', startAuto);
  sliderWrap.addEventListener('focusin', stopAuto);
  sliderWrap.addEventListener('focusout', startAuto);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopAuto(); else startAuto();
  });

  sliderWrap.addEventListener(
    'touchstart',
    function (e) { lastSwipe = e.changedTouches[0].clientX; },
    { passive: true }
  );
  sliderWrap.addEventListener(
    'touchend',
    function (e) {
      if (lastSwipe === null) return;
      var delta = e.changedTouches[0].clientX - lastSwipe;
      if (Math.abs(delta) > 42) {
        goTo(delta < 0 ? sliderIndex + 1 : sliderIndex - 1);
        startAuto();
      }
      lastSwipe = null;
    },
    { passive: true }
  );

  goTo(0);

  /* Only auto-rotate while the reviews section is on screen */
  var reviewSection = document.getElementById('reviews');
  if ('IntersectionObserver' in window) {
    var sliderIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) startAuto(); else stopAuto();
      });
    }, { threshold: 0.2 });
    sliderIO.observe(reviewSection);
  } else {
    startAuto();
  }

  reducedMotion.addEventListener('change', function () {
    if (reducedMotion.matches) { stopAuto(); } else { startAuto(); }
  });

  /* ---------------- Count-up stats ---------------- */
  var counters = document.querySelectorAll('.stat');

  function runCount(el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var start = null;
    var duration = 1300;

    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = end * eased;
      el.textContent = decimals ? val.toFixed(decimals) : Math.round(val).toString();
      if (p < 1) window.requestAnimationFrame(frame);
      else el.textContent = decimals ? end.toFixed(decimals) : end.toString();
    }

    if (prefersReduced()) {
      el.textContent = decimals ? end.toFixed(decimals) : end.toString();
      return;
    }
    window.requestAnimationFrame(frame);
  }

  if (!('IntersectionObserver' in window)) {
    counters.forEach(runCount);
  } else {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCount(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { countIO.observe(c); });
  }

  /* ---------------- Magnetic primary buttons ---------------- */
  var magneticBtns = document.querySelectorAll('.magnetic');
  var magnetTick = false;

  function magnetHandler(e) {
    var btn = this;
    var rect = btn.getBoundingClientRect();
    var x = e.clientX - rect.left - rect.width / 2;
    var y = e.clientY - rect.top - rect.height / 2;
    var px = Math.max(-7, Math.min(7, x * 0.16));
    var py = Math.max(-5, Math.min(5, y * 0.22));

    if (!magnetTick) {
      magnetTick = true;
      window.requestAnimationFrame(function () {
        btn.style.setProperty('--mx', px + 'px');
        btn.style.setProperty('--my', py + 'px');
        magnetTick = false;
      });
    }
  }

  for (var m = 0; m < magneticBtns.length; m++) {
    var btn = magneticBtns[m];
    if (!finePointer || prefersReduced()) break;
    btn.addEventListener('mousemove', magnetHandler, { passive: true });
    btn.addEventListener('mouseleave', function (e) {
      var b = e.currentTarget;
      b.style.setProperty('--mx', '0px');
      b.style.setProperty('--my', '0px');
    }, { passive: true });
  }

  /* ---------------- Reservation form validation ---------------- */
  var form = document.getElementById('quote-form');
  var success = document.getElementById('quote-success');
  var nameInput = document.getElementById('q-name');
  var phoneInput = document.getElementById('q-phone');
  var guestsSelect = document.getElementById('q-guests');
  var errorName = document.getElementById('err-name');
  var errorPhone = document.getElementById('err-phone');
  var errorGuests = document.getElementById('err-guests');

  function setError(field, errorEl, message) {
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    errorEl.textContent = message || '';
  }

  function validatePhone(raw) {
    var digits = (raw || '').replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;

    var nameVal = nameInput.value.trim();
    if (!nameVal || nameVal.length < 2) {
      setError(nameInput, errorName, "Please share your name so we know who's waiting.");
      ok = false;
    } else {
      setError(nameInput, errorName, '');
    }

    var phoneVal = phoneInput.value.trim();
    if (!phoneVal || !validatePhone(phoneVal)) {
      setError(phoneInput, errorPhone, 'Enter a valid phone number — 10 to 15 digits.');
      ok = false;
    } else {
      setError(phoneInput, errorPhone, '');
    }

    if (!guestsSelect.value) {
      setError(guestsSelect, errorGuests, 'Pick a party size.');
      ok = false;
    } else {
      setError(guestsSelect, errorGuests, '');
    }

    if (!ok) return;

    success.hidden = false;
    form.reset();
    success.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'nearest' });
  });

  [nameInput, phoneInput].forEach(function (input) {
    input.addEventListener('input', function () {
      if (this.getAttribute('aria-invalid') === 'true') {
        var err = this.id === 'q-name' ? errorName : errorPhone;
        setError(this, err, '');
      }
    });
  });
  guestsSelect.addEventListener('change', function () {
    if (this.value) setError(this, errorGuests, '');
  });

  /* ---------------- Footer year ---------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();