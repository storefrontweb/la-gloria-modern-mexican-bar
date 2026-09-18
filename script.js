document.body.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const getEl = (sel, ctx = document) => ctx.querySelector(sel);
const getEls = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const header = getEl('#site-header');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

const navToggle = getEl('#navToggle');
const siteNav = getEl('.site-nav');
if (navToggle && siteNav) {
  const setState = (open) => {
    siteNav.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  navToggle.addEventListener('click', () => setState(!siteNav.classList.contains('nav-open')));
  getEls('a', siteNav).forEach((a) => a.addEventListener('click', () => setState(false)));
}

document.addEventListener('click', (e) => {
  if (siteNav && siteNav.classList.contains('nav-open') && !siteNav.contains(e.target) && e.target !== navToggle) {
    siteNav.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
  }
});

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
});

const revealEls = getEls('.reveal');
if (revealEls.length) {
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -7% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  }
}

const marquee = getEl('.marquee-track');
if (marquee && !reduceMotion) {
  const mq = new IntersectionObserver(
    (entries) => {
      marquee.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
    },
    { threshold: 0 }
  );
  mq.observe(marquee);
}

const statNums = getEls('.stat-num');
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
if (statNums.length) {
  const runCount = (el) => {
    const target = parseFloat(el.dataset.final);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / 1500, 1);
      el.textContent = (target * easeOutCubic(progress)).toFixed(decimals);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (reduceMotion) {
    statNums.forEach((el) => {
      el.textContent = Number(el.dataset.final).toFixed(parseInt(el.dataset.decimals || '0', 10));
    });
  } else {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.45 }
    );
    statNums.forEach((el) => cio.observe(el));
  }
}

const slider = getEl('#review-slider');
const dots = getEls('.review-dot');
const panels = getEls('.review-panel');
let current = 0;
let timer = null;

const showPanel = (index) => {
  current = (index + panels.length) % panels.length;
  panels.forEach((panel, i) => {
    const active = i === current;
    panel.classList.toggle('is-active', active);
    panel.setAttribute('aria-hidden', String(!active));
  });
  dots.forEach((dot, i) => {
    const active = i === current;
    dot.classList.toggle('is-active', active);
    dot.setAttribute('aria-selected', String(active));
    dot.tabIndex = active ? 0 : -1;
  });
};

const stopRotate = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

const startRotate = () => {
  stopRotate();
  if (reduceMotion || !slider) return;
  timer = setInterval(() => showPanel(current + 1), 5200);
};

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    showPanel(i);
    startRotate();
  });
});

if (slider) {
  slider.addEventListener('pointerenter', stopRotate, { passive: true });
  slider.addEventListener('pointerleave', startRotate, { passive: true });
}

const dotsTab = getEl('.review-dots');
if (dotsTab) {
  dotsTab.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      showPanel(current + 1);
      dots[current].focus();
      startRotate();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      showPanel(current - 1);
      dots[current].focus();
      startRotate();
    } else if (e.key === 'Home') {
      e.preventDefault();
      showPanel(0);
      dots[0].focus();
      startRotate();
    } else if (e.key === 'End') {
      e.preventDefault();
      showPanel(panels.length - 1);
      dots[panels.length - 1].focus();
      startRotate();
    }
  });
}

startRotate();

const form = getEl('#quote-form');
if (form) {
  const nameInput = getEl('#qf-name', form);
  const phoneInput = getEl('#qf-phone', form);
  const successBox = getEl('#form-success');
  const setError = (input, errorEl, message) => {
    if (message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
      input.setAttribute('aria-invalid', 'true');
    } else {
      errorEl.hidden = true;
      input.removeAttribute('aria-invalid');
    }
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const digits = phoneInput.value.replace(/\D/g, '');
    const nameError = getEl('#qf-name-error', form);
    const phoneError = getEl('#qf-phone-error', form);
    let valid = true;
    if (!name) {
      setError(nameInput, nameError, 'Please tell us your name.');
      valid = false;
    } else {
      setError(nameInput, nameError, null);
    }
    if (!phoneInput.value.trim()) {
      setError(phoneInput, phoneError, 'Please enter a phone number so we can reach you.');
      valid = false;
    } else if (digits.length < 10 || digits.length > 15) {
      setError(phoneInput, phoneError, 'Please enter a valid phone number (10+ digits).');
      valid = false;
    } else {
      setError(phoneInput, phoneError, null);
    }
    if (valid && successBox) {
      successBox.hidden = false;
    }
  });
  [nameInput, phoneInput].forEach((input) => {
    input.addEventListener('input', () => {
      const err = getEl('#' + input.id + '-error', form);
      if (!err.hidden) setError(input, err, null);
    });
  });
}

const magneticBtns = getEls('.magnetic');
if (magneticBtns.length && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  magneticBtns.forEach((btn) => {
    let raf = null;
    btn.addEventListener(
      'pointermove',
      (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = ((e.clientX - rect.left - rect.width / 2) / rect.width) * 12;
        const dy = ((e.clientY - rect.top - rect.height / 2) / rect.height) * 8;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
        });
      },
      { passive: true }
    );
    btn.addEventListener('pointerleave', () => {
      if (raf) cancelAnimationFrame(raf);
      btn.style.transform = '';
    }, { passive: true });
  });
}

const yearEl = getEl('#year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());