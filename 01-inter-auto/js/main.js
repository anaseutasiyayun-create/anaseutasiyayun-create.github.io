(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    const show = () => img.classList.add('is-loaded');
    if (img.complete) show();
    else {
      img.addEventListener('load', show);
      img.addEventListener('error', show);
    }
  });
  const menu = document.getElementById('menu');
  const burger = document.querySelector('.burger');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenu(!menu.classList.contains('open'));
  });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && !menu.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 800) setMenu(false);
  });

  const header = document.querySelector('header');
  const heroImg = document.querySelector('.hero-img');
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 10);
    if (heroImg && !reduceMotion && window.innerWidth > 800 && y < 900) {
      heroImg.style.setProperty('--py', (-y * 0.12).toFixed(1) + 'px');
    }
    ticking = false;
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  onScroll();

  const groups = [
    ['.section-title', 0],
    ['.spec-grid > div', 0.1],
    ['.repair-card', 0.08],
    ['.why-card', 0.1],
    ['.review', 0.12],
    ['.repair .center, .reviews .center', 0],
    ['.contacts-info', 0],
  ];
  const items = [];
  groups.forEach(([sel, step]) => {
    document.querySelectorAll(sel).forEach((el) => {
      const i = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.classList.add('reveal');
      el.style.setProperty('--d', (step * i).toFixed(2) + 's');
      items.push(el);
    });
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          el.classList.add('in');
          io.unobserve(el);
          const delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
          setTimeout(
            () => {
              el.classList.remove('reveal', 'in');
              el.style.removeProperty('--d');
            },
            750 + delay * 1000
          );
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  const reviews = [...document.querySelectorAll('.review')];
  reviews.forEach((r) => {
    const p = r.querySelector('p');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'review-more';
    btn.textContent = 'Читать полностью';
    p.after(btn);
    btn.addEventListener('click', () => {
      const open = r.classList.toggle('open');
      btn.textContent = open ? 'Свернуть' : 'Читать полностью';
    });
  });
  function checkReviews() {
    reviews.forEach((r) => {
      if (r.classList.contains('open')) return;
      const p = r.querySelector('p');
      r.querySelector('.review-more').classList.toggle('show', p.scrollHeight > p.clientHeight + 2);
    });
  }
  checkReviews();
  window.addEventListener('resize', checkReviews);
  if (document.fonts) document.fonts.ready.then(checkReviews);

  const links = [...menu.querySelectorAll('a[href^="#"]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => spy.observe(s));
  }
})();
