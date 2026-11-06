// Portada: cotizaciones líderes + logo y enlace de la casa ganadora.
// Ambas tarjetas se calculan con el mismo conjunto de casas válidas de la tabla.
import { getEls } from './els.js';
import { rateFmt } from './format.js';
import { getCasasValidasLimpias } from './tableShared.js';
import { getCasaLogoSrc, getCasaUrl } from './logos.js';
import { withUTM } from './utm.js';

function paintWinner(kind, winner) {
  const valueEl = document.getElementById(`best-${kind}`);
  const link = document.getElementById(`best-${kind}-link`);
  const logo = document.getElementById(`best-${kind}-logo`);
  const name = document.getElementById(`best-${kind}-name`);
  const rate = winner?.[kind];
  const ready = Number.isFinite(rate) && rate > 0;
  if (valueEl) {
    valueEl.textContent = ready ? rateFmt(rate) : '—';
    valueEl.dataset.hasRate = String(ready);
  }
  if (!link || !logo || !name) return;

  const label = ready ? String(winner.casa || '').trim() : '';
  name.textContent = label || 'Sin cotizaciones';
  link.classList.remove('has-logo', 'has-link');
  logo.hidden = true;
  logo.removeAttribute('src');
  logo.alt = '';
  logo.onerror = null;
  logo.onload = null;

  const safeUrl = label ? withUTM(winner.url || getCasaUrl(label), {
    source:'preciodolarhoy', medium:'referral', campaign:'clickout', content:`mejor_${kind}`
  }) : '';
  if (safeUrl) {
    link.href = safeUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Visitar ${label} en una pestaña nueva`);
    link.removeAttribute('aria-disabled');
    link.removeAttribute('tabindex');
    link.classList.add('has-link');
  } else {
    link.removeAttribute('href');
    link.removeAttribute('target');
    link.removeAttribute('rel');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('tabindex', '-1');
    link.setAttribute('aria-label', label ? `${label}: enlace no disponible` : 'Sin cotizaciones');
  }
  const logoSrc = label ? getCasaLogoSrc(label) : null;
  if (!logoSrc) return;
  const reveal = () => {
    if (logo.naturalWidth < 1) return;
    logo.hidden = false;
    link.classList.add('has-logo');
  };
  logo.onload = reveal;
  logo.onerror = () => { logo.hidden = true; link.classList.remove('has-logo'); };
  logo.src = logoSrc;
  if (logo.complete && logo.naturalWidth > 0) reveal();
}

export function renderBestHeader() {
  const casas = getCasasValidasLimpias({fallbackToTasas:true});
  // Empates: se mantiene el primer registro como en la tabla (orden estable).
  const bestBuy = casas.reduce((best, c) => !best || c.compra > best.compra ? c : best, null);
  const bestSell = casas.reduce((best, c) => !best || c.venta < best.venta ? c : best, null);
  paintWinner('compra', bestBuy);
  paintWinner('venta', bestSell);
}
