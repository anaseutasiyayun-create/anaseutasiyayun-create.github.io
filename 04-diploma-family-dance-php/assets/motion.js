'use strict';
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  $$('[data-letters]').forEach((el) => {
    el.innerHTML = [...el.textContent]
      .map((ch, i) => `<span class="ch" style="--i:${i}">${ch}</span>`)
      .join('');
  });
  $$('[data-words]').forEach((el) => {
    el.innerHTML = el.textContent
      .trim()
      .split(/\s+/)
      .map((w) => `<span class="w">${w}</span>`)
      .join(' ');
  });

  const bar = $('#preBar');
  let progress = 0;
  const started = performance.now();
  function finishLoading() {
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
  }
  if (reduce) {
    finishLoading();
  } else {
    const tick = () => {
      progress = Math.min(progress + (90 - progress) * 0.06, 90);
      if (bar) bar.style.transform = `scaleX(${progress / 100})`;
      if (!document.body.classList.contains('is-ready')) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const done = () => {
      const wait = Math.max(0, 900 - (performance.now() - started));
      setTimeout(() => {
        if (bar) bar.style.transform = 'scaleX(1)';
        setTimeout(finishLoading, 250);
      }, wait);
    };
    if (document.readyState === 'complete') done();
    else window.addEventListener('load', done, { once: true });
    setTimeout(done, 3000);
  }

  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        revealIO.unobserve(en.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  $$('[data-reveal]').forEach((el, i) => {
    const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.setProperty('--d', `${siblings.indexOf(el) * 0.07}s`);
    if (reduce) el.classList.add('is-in');
    else revealIO.observe(el);
  });

  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        countIO.unobserve(el);
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const isYear = target > 1900 && target < 2100;
        const fmt = (n) => (isYear ? String(n) : n.toLocaleString('ru-RU'));
        if (reduce) {
          el.textContent = fmt(target) + suffix;
          return;
        }
        const from = isYear ? 1990 : 0;
        const t0 = performance.now();
        const step = (now) => {
          const p = clamp((now - t0) / 1600, 0, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = fmt(Math.round(from + (target - from) * eased)) + (p === 1 ? suffix : '');
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },
    { threshold: 0.6 }
  );
  $$('[data-count]').forEach((el) => countIO.observe(el));

  $$('.ph').forEach((ph) => {
    const val = getComputedStyle(ph).getPropertyValue('--img').trim();
    if (!val || val === 'none' || /url\((['"]?)\1\)/.test(val)) ph.classList.add('ph--empty');
  });

  const header = $('.header');
  let lastY = scrollY;

  const manifesto = $('[data-words]');
  const words = manifesto ? $$('.w', manifesto) : [];

  const parallax = $$('[data-parallax]');

  const hs = $('.hscroll');
  const hsTrack = hs && $('.hscroll__track', hs);
  const hsEnabled = () => hs && innerWidth > 900 && !reduce;
  function sizeHScroll() {
    if (!hs) return;
    if (hsEnabled()) {
      const distance = hsTrack.scrollWidth - innerWidth;
      hs.style.height = `${innerHeight + distance}px`;
      hs.classList.add('is-pinned');
    } else {
      hs.style.height = '';
      hs.classList.remove('is-pinned');
      hsTrack.style.transform = '';
    }
  }
  sizeHScroll();
  addEventListener('resize', sizeHScroll);
  addEventListener('load', sizeHScroll);

  function onScroll() {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    header.classList.toggle(
      'is-hidden',
      y > lastY && y > 400 && !document.body.classList.contains('menu-open')
    );
    lastY = y;

    if (words.length) {
      const r = manifesto.getBoundingClientRect();
      const p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35), 0, 1);
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', reduce || i < lit));
    }

    if (!reduce) {
      parallax.forEach((el) => {
        const speed = Number(el.dataset.parallax) || 0.2;
        if (y < innerHeight * 1.5) el.style.transform = `translate3d(0, ${y * speed}px, 0) scale(1.1)`;
      });
    }

    if (hsEnabled()) {
      const r = hs.getBoundingClientRect();
      const distance = hsTrack.scrollWidth - innerWidth;
      const p = clamp(-r.top / (hs.offsetHeight - innerHeight), 0, 1);
      hsTrack.style.transform = `translate3d(${-p * distance}px, 0, 0)`;
      hs.style.setProperty('--p', p.toFixed(3));
    }
  }
  addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
  onScroll();

  if (reduce || !finePointer) return;

  document.documentElement.classList.add('has-cursor');
  const cursor = $('.cursor');
  const label = $('.cursor__label');
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const ring = { x: mouse.x, y: mouse.y };
  addEventListener(
    'mousemove',
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true }
  );

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, button, summary, select, input, textarea, label, [data-cursor]');
    cursor.classList.toggle('is-hover', !!target);
    const text = target?.closest('[data-cursor]')?.dataset.cursor || '';
    label.textContent = text;
    cursor.classList.toggle('is-label', !!text);
    cursor.classList.toggle('is-invert', !!target?.closest('.dir__row'));
  });
  document.addEventListener('mousedown', () => cursor.classList.add('is-down'));
  document.addEventListener('mouseup', () => cursor.classList.remove('is-down'));
  document.addEventListener('mouseleave', () => cursor.classList.add('is-gone'));
  document.addEventListener('mouseenter', () => cursor.classList.remove('is-gone'));

  const hero = $('.hero');
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    hero.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    hero.style.setProperty('--tx', (e.clientX / r.width - 0.5).toFixed(3));
    hero.style.setProperty('--ty', (e.clientY / r.height - 0.5).toFixed(3));
  });

  $$('.magnetic, .badge-spin').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.25}px, ${dy * 0.3}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });

  $$('.tilt').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-4px)`;
      card.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
      card.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  (function loop() {
    ring.x = lerp(ring.x, mouse.x, 0.2);
    ring.y = lerp(ring.y, mouse.y, 0.2);
    cursor.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
    requestAnimationFrame(loop);
  })();
})();
