(() => {
  'use strict';
  const config = window.REVIEWS_CONFIG;
  const section = document.querySelector('#depoimentos');
  const grid = document.querySelector('#reviews-grid');
  const formLink = document.querySelector('#review-form-link');
  const controls = document.querySelector('#reviews-controls');
  const previous = document.querySelector('#reviews-prev');
  const next = document.querySelector('#reviews-next');
  const pause = document.querySelector('#reviews-pause');
  const counter = document.querySelector('#reviews-counter');
  const announcement = document.querySelector('#reviews-announcement');
  if (!config || !section || !grid || !window.fetch) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isEndpoint = value => {
    try {
      const url = new URL(value);
      return url.origin === 'https://script.google.com' && /^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) && !url.search && !url.hash;
    } catch { return false; }
  };
  if (!isEndpoint(config.endpoint)) return;
  try {
    const url = new URL(config.formUrl);
    if (url.protocol === 'https:' && (url.hostname === 'forms.gle' || (url.hostname === 'docs.google.com' && url.pathname.startsWith('/forms/')))) {
      formLink.href = url.href;
      formLink.hidden = false;
    }
  } catch { /* The public feedback link is optional. */ }

  function card(review, index, total) {
    const figure = document.createElement('figure');
    figure.className = 'review-card';
    figure.setAttribute('role', 'group');
    figure.setAttribute('aria-roledescription', 'slide');
    figure.setAttribute('aria-label', `${index + 1} de ${total}`);
    if (Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5) {
      const stars = document.createElement('div');
      stars.className = 'review-stars';
      stars.setAttribute('role', 'img');
      stars.setAttribute('aria-label', `Avaliação: ${review.rating} de 5 estrelas`);
      const glyphs = document.createElement('span');
      glyphs.setAttribute('aria-hidden', 'true');
      glyphs.textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      stars.append(glyphs);
      figure.append(stars);
    }
    const quote = document.createElement('blockquote');
    const text = document.createElement('p');
    text.textContent = review.text;
    quote.append(text);
    const caption = document.createElement('figcaption');
    const name = document.createElement('strong');
    name.textContent = review.name;
    const source = document.createElement('span');
    source.textContent = 'Recebido pelo formulário do escritório';
    caption.append(name, source);
    if (/^\d{4}-\d{2}-\d{2}$/.test(review.date || '')) {
      const date = new Date(review.date + 'T12:00:00');
      if (!Number.isNaN(date.getTime())) {
        const time = document.createElement('time');
        time.dateTime = review.date;
        time.textContent = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
        caption.append(time);
      }
    }
    figure.append(quote, caption);
    return figure;
  }

  let cards = [], reviews = [], index = 0, signature = '', loading = false;
  let timer, paused = motion.matches, hovered = false;
  function schedule() {
    window.clearTimeout(timer);
    const running = cards.length > 1 && !paused && !hovered && !motion.matches && !document.hidden;
    if (pause) {
      pause.hidden = motion.matches;
      pause.textContent = paused ? 'Retomar rotação' : 'Pausar rotação';
    }
    // Longer reviews get more reading time; there is no forced movement on focus.
    if (running) timer = window.setTimeout(() => show(index + 1), Math.max(10000, reviews[index].text.length * 65));
  }
  function show(target, manual = false) {
    if (!cards.length) return;
    const old = index;
    index = (target + cards.length) % cards.length;
    cards.forEach((element, i) => {
      element.classList.toggle('is-active', i === index);
      element.classList.toggle('is-leaving', i === old && old !== index);
      element.setAttribute('aria-hidden', String(i !== index));
      element.inert = i !== index;
    });
    if (counter) counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    if (manual && announcement) announcement.textContent = `Depoimento ${index + 1} de ${cards.length}, de ${reviews[index].name}.`;
    schedule();
  }
  function stop() { paused = true; schedule(); }
  previous?.addEventListener('click', () => { paused = true; show(index - 1, true); });
  next?.addEventListener('click', () => { paused = true; show(index + 1, true); });
  let pauseIntent;
  pause?.addEventListener('pointerdown', () => { pauseIntent = !paused; });
  pause?.addEventListener('click', () => { paused = pauseIntent ?? !paused; pauseIntent = undefined; schedule(); });
  const stage = document.querySelector('.reviews-stage');
  stage?.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  stage?.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  stage?.addEventListener('focusin', stop);
  stage?.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') stop(); });
  motion.addEventListener('change', () => { if (motion.matches) paused = true; schedule(); });

  async function load() {
    if (loading || document.hidden) return;
    loading = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const url = new URL(config.endpoint);
      url.searchParams.set('v', String(Date.now()));
      const response = await fetch(url.href, { signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'follow' });
      if (!response.ok) throw new Error('Feed indisponível');
      const payload = await response.json();
      if (payload.version !== 1 || payload.unavailable || !Array.isArray(payload.reviews)) throw new Error('Feed inválido');
      const fresh = payload.reviews.filter(review => review && typeof review.name === 'string' && review.name.trim() && review.name.length <= 80 && typeof review.text === 'string' && review.text.trim() && review.text.length <= 800).slice(0, 6);
      const freshSignature = JSON.stringify(fresh);
      if (freshSignature !== signature) {
        signature = freshSignature;
        reviews = fresh;
        cards = reviews.map((review, i) => card(review, i, reviews.length));
        grid.replaceChildren(...cards);
        grid.classList.toggle('is-deck', cards.length > 1);
        index = Math.min(index, Math.max(0, cards.length - 1));
        show(index);
      }
      section.hidden = reviews.length === 0;
      if (controls) controls.hidden = cards.length < 2;
    } catch {
      grid.replaceChildren();
      cards = []; reviews = []; signature = '';
      section.hidden = true;
      if (controls) controls.hidden = true;
      window.clearTimeout(timer);
    } finally {
      window.clearTimeout(timeout);
      loading = false;
    }
  }
  load();
  window.setInterval(load, 120000);
  document.addEventListener('visibilitychange', () => { schedule(); if (!document.hidden) load(); });
})();
