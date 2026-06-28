

const EMAILJS_CONFIG = {
  publicKey: window.__ENV__?.EMAILJS_KEY || '',
  serviceId:  'service_roiuayd',
  templateContact: 'template_kitsbc8',
  templateReply:   '',
};

const TRACK_SRCS = [
  'assets/audio/mix01.mp3',
  'assets/audio/mix02.mp3',
  'assets/audio/mix03.mp3',
  'assets/audio/mix04.mp3',
];

const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function initNav() {
  const nav        = $('#navbar');
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  const sections   = $$('section[id]');
  const links      = $$('.nav-link');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 40);
      let current = '';
      sections.forEach(sec => {
        if (y >= sec.offsetTop - 120) current = sec.id;
      });
      links.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
      });

      ticking = false;
    });
    ticking = true;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const openMenu  = () => { hamburger.classList.add('open'); mobileMenu.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeMenu = () => { hamburger.classList.remove('open'); mobileMenu.classList.remove('open'); document.body.style.overflow = ''; };

  hamburger.addEventListener('click', () => hamburger.classList.contains('open') ? closeMenu() : openMenu());
  $$('.mob-link').forEach(l => l.addEventListener('click', closeMenu));
  mobileMenu.addEventListener('click', e => { if (e.target === mobileMenu) closeMenu(); });
}

function initHeroCanvas() {
  const canvas = $('#heroCanvas');
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  let W, H, particles = [], animId;

  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildParticles();
  };

  const PARTICLE_COUNT = 60;

  function buildParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.5 + 0.2,
    }));
  }
  const WAVE_LINES = 3;
  const waves = Array.from({ length: WAVE_LINES }, (_, i) => ({
    amplitude: 30 + i * 18,
    frequency: 0.008 + i * 0.003,
    speed:     0.0008 + i * 0.0004,
    phase:     (i * Math.PI * 2) / WAVE_LINES,
    color:     i === 0 ? '#00E5C3' : i === 1 ? '#00C2E0' : '#00b89b',
    opacity:   0.18 - i * 0.04,
  }));

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t++;
    waves.forEach(wave => {
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      for (let x = 0; x <= W; x += 4) {
        const y = H / 2
          + Math.sin(x * wave.frequency + t * wave.speed + wave.phase) * wave.amplitude
          + Math.sin(x * wave.frequency * 2 + t * wave.speed * 1.5) * (wave.amplitude * 0.3);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 195, ${p.alpha})`;
      ctx.fill();
    });

    animId = requestAnimationFrame(draw);
  }
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animId = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animId);
    }
  }, { threshold: 0 });
  observer.observe(canvas);
  resize();
  draw();
  window.addEventListener('resize', () => { cancelAnimationFrame(animId); resize(); draw(); });
}

function initCounters() {
  const counters = $$('[data-target]');
  if (!counters.length) return;

  const run = (el) => {
    const target = +el.dataset.target;
    const duration = 1800;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed  = now - startTime;
      const progress = clamp(elapsed / duration, 0, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => obs.observe(c));
}

function initScrollReveal() {
  const els = $$('.reveal-up, .reveal-left, .reveal-right');
  if (!els.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
}

function initPlayers() {
  const cards = $$('.track-card');
  let activeIdx = null;
  const players = [];

  cards.forEach((card, idx) => {
    const playBtn      = $('.play-btn', card);
    const iconPlay     = $('.icon-play', playBtn);
    const iconPause    = $('.icon-pause', playBtn);
    const progressFill = $('.progress-fill', card);
    const progressBar  = $('.progress-bar', card);
    const timeCur      = $('.time-cur', card);

    const src = TRACK_SRCS[idx];
    let audio = src ? new Audio(src) : null;

    const fmt = (s) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60).toString().padStart(2, '0');
      return `${m}:${sec}`;
    };

    const stop = () => {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    };

    const resetUI = () => {
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
      playBtn.classList.remove('playing');
      progressFill.style.width = '0%';
      timeCur.textContent = '0:00';
    };

    if (audio) {
      audio.addEventListener('timeupdate', () => {
        const pct = (audio.currentTime / audio.duration) * 100 || 0;
        progressFill.style.width = `${pct}%`;
        timeCur.textContent = fmt(audio.currentTime);
      });
      audio.addEventListener('ended', () => { resetUI(); activeIdx = null; });
    }
    progressBar.addEventListener('click', (e) => {
      if (!audio || !audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      const pct  = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
    });

    playBtn.addEventListener('click', () => {
      if (!audio) {
        demoPlay(idx, progressFill, timeCur, iconPlay, iconPause, playBtn, card);
        return;
      }

      const isPlaying = activeIdx === idx;
      players.forEach((p, i) => { if (i !== idx) { p.stop(); p.resetUI(); } });
      activeIdx = null;

      if (isPlaying) {
        stop();
        resetUI();
      } else {
        audio.play().catch(() => {});
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        playBtn.classList.add('playing');
        activeIdx = idx;
      }
    });

    players.push({ stop, resetUI });
  });
  const demoTimers = {};
  function demoPlay(idx, fill, timeCur, iconPlay, iconPause, btn, card) {
    if (demoTimers[idx]) {
      clearInterval(demoTimers[idx].interval);
      clearTimeout(demoTimers[idx].timeout);
      demoTimers[idx] = null;
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
      btn.classList.remove('playing');
      fill.style.width = '0%';
      timeCur.textContent = '0:00';
      return;
    }
    Object.keys(demoTimers).forEach(k => {
      if (+k !== idx && demoTimers[k]) {
        clearInterval(demoTimers[k].interval);
        clearTimeout(demoTimers[k].timeout);
        demoTimers[k] = null;
        const c = cards[+k];
        $('.icon-play', c).classList.remove('hidden');
        $('.icon-pause', c).classList.add('hidden');
        $('.play-btn', c).classList.remove('playing');
        $('.progress-fill', c).style.width = '0%';
        $('.time-cur', c).textContent = '0:00';
      }
    });

    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
    btn.classList.add('playing');

    const durText = $('.time-dur', card).textContent;
    const [m, s]  = durText.split(':').map(Number);
    const totalSec = m * 60 + s;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 0.1;
      const pct = (elapsed / totalSec) * 100;
      fill.style.width = `${Math.min(pct, 100)}%`;
      timeCur.textContent = `${Math.floor(elapsed / 60)}:${Math.floor(elapsed % 60).toString().padStart(2, '0')}`;
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      demoTimers[idx] = null;
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
      btn.classList.remove('playing');
      fill.style.width = '0%';
      timeCur.textContent = '0:00';
    }, totalSec * 1000);

    demoTimers[idx] = { interval, timeout };
  }
}

function initContactForm() {
  const form      = $('#contactForm');
  if (!form) return;

  const submitBtn  = $('#submitBtn');
  const btnText    = $('.btn-text', submitBtn);
  const btnLoading = $('.btn-loading', submitBtn);
  const btnArrow   = $('.btn-arrow', submitBtn);
  const success    = $('#formSuccess');
  const fail       = $('#formFail');
  if (window.emailjs && EMAILJS_CONFIG.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
    emailjs.init(EMAILJS_CONFIG.publicKey);
  }
  const fields = {
    name:    { el: $('#name'),    err: $('#nameError') },
    email:   { el: $('#email'),   err: $('#emailError') },
    team:    { el: $('#team'),    err: $('#teamError') },
    message: { el: $('#message'), err: $('#messageError') },
  };

  const validate = () => {
    let ok = true;
    const { name, email, team, message } = fields;
    Object.values(fields).forEach(f => {
      f.el.classList.remove('error');
      f.err.textContent = '';
    });

    if (!name.el.value.trim()) {
      name.el.classList.add('error');
      name.err.textContent = 'Name is required.';
      ok = false;
    }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const knownDomains = [
      // Google
      'gmail.com', 'googlemail.com',
      // Microsoft
      'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'live.co.uk', 'msn.com',
      // Apple
      'icloud.com', 'me.com', 'mac.com',
      // Yahoo
      'yahoo.com', 'yahoo.co.uk', 'yahoo.com.ph', 'ymail.com',
      // Other common
      'protonmail.com', 'proton.me', 'aol.com', 'zoho.com',
      'mail.com', 'gmx.com', 'gmx.net',
      // Philippines-specific
      'yahoo.com.ph',
      // School / org
      'edu.ph', 'com.ph', 'org.ph',
      // Business common
      'business.com',
    ];

    if (!email.el.value.trim()) {
      email.el.classList.add('error');
      email.err.textContent = 'Email is required.';
      ok = false;
    } else if (!emailRx.test(email.el.value.trim())) {
      email.el.classList.add('error');
      email.err.textContent = 'Please enter a valid email.';
      ok = false;
    } else {
      const domain = email.el.value.trim().toLowerCase().split('@')[1];
      if (!knownDomains.includes(domain)) {
        email.el.classList.add('error');
        email.err.textContent = 'Please double-check your email domain (e.g. gmail.com, yahoo.com).';
        ok = false;
      }
    }
    return ok;
  };
  Object.values(fields).forEach(({ el, err }) => {
    el.addEventListener('blur', () => {
      if (el.value.trim()) { el.classList.remove('error'); err.textContent = ''; }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const serviceEl  = $('#service');
    const templateParams = {
      from_name:  fields.name.el.value.trim(),
      from_email: fields.email.el.value.trim(),
      team_name:  fields.team.el.value.trim(),
      service:    serviceEl.options[serviceEl.selectedIndex].text || 'Not specified',
      message:    fields.message.el.value.trim(),
      to_name:    fields.name.el.value.trim().split(' ')[0],
      to_email:   fields.email.el.value.trim(),
    };
    btnText.classList.add('hidden');
    btnArrow.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    submitBtn.disabled = true;
    success.classList.add('hidden');
    fail.classList.add('hidden');
    if (!window.emailjs || EMAILJS_CONFIG.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
      await new Promise(r => setTimeout(r, 1400));
      showSuccess();
      return;
    }

    try {
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateContact,
        templateParams
      );
      if (EMAILJS_CONFIG.templateReply) {
        await emailjs.send(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateReply,
          templateParams
        );
      }
      showSuccess();
    } catch (err) {
      console.error('EmailJS error:', err);
      showFail();
    }
  });

  function showSuccess() {
    resetBtn();
    success.classList.remove('hidden');
    form.reset();
  }

  function showFail() {
    resetBtn();
    fail.classList.remove('hidden');
  }

  function resetBtn() {
    btnText.classList.remove('hidden');
    btnArrow.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

function initCustomSelects() {
  $$('.custom-select').forEach(selectWrap => {
    const native = $(`#${selectWrap.dataset.select}`);
    const trigger = $('.custom-select-trigger', selectWrap);
    const triggerText = $('span', trigger);
    const options = $$('[role="option"]', selectWrap);
    if (!native || !trigger || !options.length) return;

    const close = () => {
      selectWrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const open = () => {
      $$('.custom-select.open').forEach(openSelect => {
        if (openSelect !== selectWrap) {
          openSelect.classList.remove('open');
          $('.custom-select-trigger', openSelect)?.setAttribute('aria-expanded', 'false');
        }
      });
      selectWrap.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    const choose = option => {
      native.value = option.dataset.value;
      triggerText.textContent = option.textContent;
      options.forEach(item => item.setAttribute('aria-selected', item === option ? 'true' : 'false'));
      native.dispatchEvent(new Event('change', { bubbles: true }));
      close();
    };

    trigger.addEventListener('click', () => selectWrap.classList.contains('open') ? close() : open());
    options.forEach(option => option.addEventListener('click', () => choose(option)));

    trigger.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
        options.find(option => option.getAttribute('aria-selected') === 'true')?.focus();
      }
    });

    selectWrap.addEventListener('keydown', e => {
      const current = document.activeElement;
      const idx = options.indexOf(current);
      if (e.key === 'Escape') {
        close();
        trigger.focus();
      }
      if (e.key === 'ArrowDown' && idx > -1) {
        e.preventDefault();
        options[(idx + 1) % options.length].focus();
      }
      if (e.key === 'ArrowUp' && idx > -1) {
        e.preventDefault();
        options[(idx - 1 + options.length) % options.length].focus();
      }
    });

    native.form?.addEventListener('reset', () => {
      setTimeout(() => choose(options[0]), 0);
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.custom-select')) {
      $$('.custom-select.open').forEach(selectWrap => {
        selectWrap.classList.remove('open');
        $('.custom-select-trigger', selectWrap)?.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

function injectSvgDefs() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'svg-defs');
  svg.innerHTML = `
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#00E5C3"/>
        <stop offset="100%" stop-color="#00C2E0"/>
      </linearGradient>
    </defs>`;
  document.body.prepend(svg);
}

function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
    window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  injectSvgDefs();
  initNav();
  initHeroCanvas();
  initCounters();
  initScrollReveal();
  initPlayers();
  initContactForm();
  initCustomSelects();
  initSmoothScroll();
});

