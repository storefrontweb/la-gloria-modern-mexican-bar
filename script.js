(() => {
  'use strict';

  document.body.classList.add('js');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.add('ready');
  }));

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  // Current year in footer
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Sticky header shadow
  const onScroll = () => document.body.classList.toggle('scrolled', (window.scrollY || 0) > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle
  const toggle = $('#nav-toggle');
  const navPanel = $('#primary-nav');
  if (toggle && navPanel) {
    const setOpen = (o) => {
      document.body.classList.toggle('nav-open', o);
      toggle.setAttribute('aria-expanded', String(o));
      toggle.setAttribute('aria-label', o ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
    navPanel.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  }

  // Smooth anchors
  $$('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    a.addEventListener('click', (e) => {
      const target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      if (a.classList.contains('skip-link')) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });

  // Scroll reveals with staggered delays
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const el = en.target;
          el.classList.add('in-view');
          setTimeout(() => el.classList.remove('reveal'), 1450);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in-view'));
  }

  // Count-up stats (real numbers only)
  const counters = $$('[data-count]');
  const setCount = (el, v, dec) => {
    el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
  };
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    if (reduce.matches) { setCount(el, target, dec); return; }
    const dur = 1500;
    const t0 = performance.now();
    const frame = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      setCount(el, target * (1 - Math.pow(1 - p, 3)), dec);
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          runCount(en.target);
          cio.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach(runCount);
  }

  // Review slider — auto-rotate, dots as tabs, keyboard + swipe
  const slider = $('.review-slider');
  if (slider) {
    const panes = $$('.review-panel', slider);
    const dots = $$('.rev-dot', slider);
    const prev = $('.rev-prev', slider);
    const next = $('.rev-next', slider);
    let idx = 0;
    let timer = null;

    const goTo = (i) => {
      idx = ((i % panes.length) + panes.length) % panes.length;
      panes.forEach((p, j) => {
        const on = j === idx;
        p.hidden = !on;
        p.setAttribute('aria-hidden', String(!on));
      });
      dots.forEach((d, j) => {
        const on = j === idx;
        d.classList.toggle('active', on);
        d.setAttribute('aria-selected', String(on));
        d.tabIndex = on ? 0 : -1;
      });
    };

    const play = () => {
      if (!reduce.matches && panes.length > 1) {
        stop();
        timer = setInterval(() => goTo(idx + 1), 5200);
      }
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    dots.forEach((d, j) => d.addEventListener('click', () => { stop(); goTo(j); play(); }));
    if (prev) prev.addEventListener('click', () => { stop(); goTo(idx - 1); play(); });
    if (next) next.addEventListener('click', () => { stop(); goTo(idx + 1); play(); });

    const dotsTablist = $('.review-dots', slider);
    if (dotsTablist) {
      dotsTablist.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        stop();
        goTo(e.key === 'ArrowRight' ? idx + 1 : idx - 1);
        play();
        dots[dots.findIndex((d) => d.getAttribute('aria-selected') === 'true')]?.focus();
      });
    }

    let touchX = null;
    slider.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 44) { stop(); goTo(dx < 0 ? idx + 1 : idx - 1); play(); }
      touchX = null;
    }, { passive: true });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', play);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', play);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else play();
    });

    goTo(0);
    if (!reduce.matches && panes.length > 1) play();
  }

  // Quote / reservation form validation + inline success
  const form = $('#quote-form');
  if (form) {
    const err = (id, on) => { const el = $(id); if (el) el.hidden = !on; };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#q-name');
      const phone = $('#q-phone');
      const date = $('#q-date');
      let ok = true;

      if (name.value.trim().length < 2) {
        ok = false;
        name.setAttribute('aria-invalid', 'true');
        err('#err-name', true);
      } else {
        name.removeAttribute('aria-invalid');
        err('#err-name', false);
      }

      const digits = phone.value.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        ok = false;
        phone.setAttribute('aria-invalid', 'true');
        err('#err-phone', true);
      } else {
        phone.removeAttribute('aria-invalid');
        err('#err-phone', false);
      }

      if (!date.value) {
        ok = false;
        date.setAttribute('aria-invalid', 'true');
        err('#err-date', true);
      } else {
        date.removeAttribute('aria-invalid');
        err('#err-date', false);
      }

      if (!ok) return;

      form.reset();
      const msg = $('#quote-success');
      if (msg) {
        msg.hidden = false;
        msg.focus({ preventScroll: true });
      }
    });
  }

  // Magnetic primary buttons (fine pointers only)
  if (fine.matches && !reduce.matches) {
    $$('.magnetic').forEach((btn) => {
      let raf = null;
      btn.addEventListener('mousemove', (e) => {
        if (raf) return;
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        raf = requestAnimationFrame(() => {
          btn.style.transform = `translate(${(x * 10).toFixed(1)}px, ${(y * 7).toFixed(1)}px)`;
          raf = null;
        });
      }, { passive: true });
      btn.addEventListener('mouseleave', () => {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        btn.style.transform = '';
      }, { passive: true });
    });
  }
})();