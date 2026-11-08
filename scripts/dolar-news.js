/*
  PrecioDolarHoy.pe — Noticias del dólar (frontend solamente)
  API pública: dolar-news (Worker independiente del comparador).
  Inserta la sección después de Guías útiles SIN modificar otros componentes.
  Si no hay noticias válidas o la API falla, no se muestra una sección vacía.
*/
(() => {
  'use strict';

  const ENDPOINT = 'https://dolar-news.jaime-araujo-martech.workers.dev/api/noticias';
  const MAX_ITEMS = 3;
  const MAX_AGE_MS = 72 * 60 * 60 * 1000;
  // Imágenes propias e ilustrativas. No son fotos originales de cada noticia.
  const NEWS_IMAGES = [
    '/IMG/noticias/dolar-y-soles.webp',
    '/IMG/noticias/mercado-cambiario.webp',
    '/IMG/noticias/economia-peruana.webp',
  ];

  const create = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  const normalize = (item, now) => {
    if (!item || typeof item.titulo !== 'string' || typeof item.url !== 'string') return null;
    const titulo = item.titulo.trim();
    if (!titulo || titulo.length > 250) return null;
    let url;
    try { url = new URL(item.url); } catch { return null; }
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const timestamp = Date.parse(item.fecha);
    if (!Number.isFinite(timestamp) || timestamp > now + 5 * 60 * 1000 || now - timestamp > MAX_AGE_MS) return null;
    return {
      titulo,
      url: url.href,
      fuente: typeof item.fuente === 'string' && item.fuente.trim() ? item.fuente.trim().slice(0, 65) : 'Fuente externa',
      timestamp,
    };
  };

  const formatDate = (timestamp) => new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima', year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(timestamp));

  function addStyle() {
    if (document.querySelector('link[data-pdh-news-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/dolar-news.css';
    link.setAttribute('data-pdh-news-styles', '');
    document.head.appendChild(link);
  }

  function render(items) {
    if (document.getElementById('pdh-news')) return;
    const guides = document.querySelector('.guide-section');
    const info = document.querySelector('.info-grid');
    if (!guides && !info) return;
    addStyle();

    const section = create('section', 'pdh-news');
    section.id = 'pdh-news';
    section.setAttribute('aria-labelledby', 'pdh-news-title');
    const header = create('div', 'pdh-news__heading');
    const titleWrap = create('div', 'pdh-news__heading-text');
    const title = create('h2', 'pdh-news__title', 'Noticias del dólar en Perú');
    title.id = 'pdh-news-title';
    titleWrap.appendChild(title);
    titleWrap.appendChild(create('p', 'pdh-news__subtitle', 'Titulares recientes de medios externos.'));
    header.appendChild(titleWrap);
    section.appendChild(header);

    const grid = create('div', 'pdh-news__grid');
    items.forEach((item, index) => {
      const article = create('article', 'pdh-news__card');
      const thumb = create('img', 'pdh-news__thumb');
      thumb.src = NEWS_IMAGES[index % NEWS_IMAGES.length];
      thumb.alt = ''; // Decorativa: no representa la noticia específica.
      thumb.width = 116;
      thumb.height = 87;
      thumb.loading = 'lazy';
      thumb.decoding = 'async';
      article.appendChild(thumb);
      const details = create('div', 'pdh-news__details');
      const link = create('a', 'pdh-news__link', item.titulo);
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      details.appendChild(link);
      details.appendChild(create('p', 'pdh-news__meta', `${item.fuente} · ${formatDate(item.timestamp)}`));
      article.appendChild(details);
      grid.appendChild(article);
    });
    section.appendChild(grid);
    if (guides) guides.insertAdjacentElement('afterend', section);
    else info.insertAdjacentElement('beforebegin', section);
  }

  async function init() {
    if (document.getElementById('pdh-news')) return;
    if (!document.querySelector('.guide-section') && !document.querySelector('.info-grid')) return;
    try {
      const controller = new AbortController();
      // La versión de Cloudflare consulta varios feeds en paralelo, con máximo 7 segundos por origen.
      const timer = setTimeout(() => controller.abort(), 12000);
      let response;
      try {
        response = await fetch(ENDPOINT, { signal: controller.signal, headers: { accept: 'application/json' } });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data?.items)) return;
      const now = Date.now();
      const seen = new Set();
      const items = [];
      for (const raw of data.items) {
        const item = normalize(raw, now);
        if (!item || seen.has(item.url)) continue;
        seen.add(item.url);
        items.push(item);
      }
      items.sort((a, b) => b.timestamp - a.timestamp);
      if (items.length) render(items.slice(0, MAX_ITEMS));
    } catch (error) {
      // Sección opcional: no afecta la calculadora ni el comparador cuando falla la API.
      console.info('Noticias del dólar no disponibles por ahora.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
