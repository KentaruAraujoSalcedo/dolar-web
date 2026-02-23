// ==============================
// File: scripts/ui/table.js
// ==============================

import { state } from '../state.js';
import { $ } from './dom.js';
import { getHaveWant } from './haveWant.js';
import { moneyFmt, rateFmt } from './format.js';
import { getCasaLogoSrc } from './logos.js';
import { attachAhorroToWinnerRow } from './savings.js';
import { withUTM } from './utm.js';

// ⚠️ IMPORTANTE (GitHub Pages)
// Si tu web vive en /NOMBRE-REPO/, pon BASE_PATH = '/NOMBRE-REPO/'.
// Si estás en dominio raíz, déjalo en ''.
const BASE_PATH = ''; // ejemplo: '/precio-dolar-hoy/'

/* ============================================================
   TABLA: render
   - Logos
   - Fila ganadora (winner-row)
   - Ahorro estimado para winner (solo en modo recibir)
   ============================================================ */
export function renderTabla() {
  const tbody = $('#tablaCuerpo');
  if (!tbody) return;
  tbody.innerHTML = '';

  let filas = ordenarValidasSegunModo();

  // ✅ Mostrar SOLO tasas frescas (scraper real)
  filas = filas.filter(c => (c.source || '').toLowerCase() === 'scraper');

  // ✅ Quitar SUNAT de la tabla (SUNAT no es casa de cambio)
  filas = filas.filter(c => (c.slug ?? '').toLowerCase() !== 'sunat' && String(c.casa).toUpperCase() !== 'SUNAT');

  // ✅ Home SIEMPRE = Top 3 (el ranking completo vive en el modal)
  const TOP_N = 3;
  filas = filas.slice(0, TOP_N);

  // ============================
  // DEFINIR QUÉ SE PINTA (tu lógica intacta)
  // ============================
  const { modo } = state;
  const { have, want } = getHaveWant();

  let bestCompra = null;
  let worstCompra = null;
  let bestVenta = null;
  let worstVenta = null;

  const paintCompra =
    (modo === 'recibir' && have === 'USD' && want === 'PEN') ||
    (modo === 'necesito' && want === 'PEN' && have === 'USD');

  const paintVenta =
    (modo === 'recibir' && have === 'PEN' && want === 'USD') ||
    (modo === 'necesito' && want === 'USD' && have === 'PEN');

  // USD → PEN => COMPRA importa (más alta = mejor)
  if (paintCompra && filas.length) {
    bestCompra = Math.max(...filas.map(c => c.compra));
    worstCompra = Math.min(...filas.map(c => c.compra));
  }

  // PEN → USD => VENTA importa (más baja = mejor)
  if (paintVenta && filas.length) {
    bestVenta = Math.min(...filas.map(c => c.venta));
    worstVenta = Math.max(...filas.map(c => c.venta));
  }

  // ============================
  // Winner casa (para resaltar 1 opción)
  // ============================
  let winnerCasa = null;

  if (paintCompra && bestCompra != null) {
    winnerCasa = (filas.find(x => x.compra === bestCompra))?.casa || null;
  }
  if (paintVenta && bestVenta != null) {
    winnerCasa = (filas.find(x => x.venta === bestVenta))?.casa || null;
  }

  // (Opcional) debug: casas sin logo
  const missing = new Set();

  // ============================
  // Render filas
  // ============================
  for (const c of filas) {
    const tr = document.createElement('tr');
    tr.className = 'fila-casa';
    tr.dataset.compra = c.compra;
    tr.dataset.venta = c.venta;

    const isWinner = (winnerCasa && c.casa === winnerCasa);
    if (isWinner) tr.classList.add('winner-row');

    // Logo con normalizador + BASE_PATH para GH Pages
    const rawLogo = getCasaLogoSrc(c.casa);
    const logoSrc = rawLogo ? (BASE_PATH + rawLogo.replace(/^\//, '')) : null;
    if (!logoSrc) missing.add(c.casa);

    const casaLabel = String(c.casa || '').trim() || 'Casa de cambio';

    const urlConUTM = c.url
      ? withUTM(c.url, {
        source: 'preciodolarhoy',
        medium: 'referral',
        campaign: 'clickout',
        content: 'tabla',
      })
      : '';


    const casaCell = `
  <td class="casa">
      <a class="casa-wrap" href="${urlConUTM}" target="_blank" rel="noopener sponsored" title="${casaLabel}">
      <span class="casa-logo ${logoSrc ? '' : 'is-missing'}" aria-hidden="${logoSrc ? 'false' : 'true'}">
        ${logoSrc
        ? `<img src="${logoSrc}" alt="${casaLabel}" loading="lazy" decoding="async">`
        : `<span class="logo-fallback" aria-hidden="true">${casaLabel.slice(0, 2).toUpperCase()}</span>`
      }
      </span>

      <!-- Mantén el nombre solo para accesibilidad/SEO -->
      <span class="casa-name sr-only">${casaLabel}</span>

      <span class="casa-chevron" aria-hidden="true">▾</span>
    </a>
  </td>
`;


    tr.innerHTML = `
      ${casaCell}

      <td class="compra
        ${paintCompra && c.compra === bestCompra ? 'mejor-compra' : ''}
        ${paintCompra && c.compra === worstCompra ? 'peor-compra' : ''}">
        ${rateFmt(c.compra)}
      </td>

      <td class="venta
        ${paintVenta && c.venta === bestVenta ? 'mejor-venta' : ''}
        ${paintVenta && c.venta === worstVenta ? 'peor-venta' : ''}">
        ${rateFmt(c.venta)}
      </td>

      <td class="resultado">-</td>
    `;

    tbody.appendChild(tr);
  }

  if (missing.size) {
    console.log('Casas sin logo (por nombre no coincide o ruta falla):', [...missing]);
  }

  actualizarEncabezadosTabla();
  recalcularCeldas();

  // ✅ ahora viene de savings.js
  attachAhorroToWinnerRow();
}

/* ============================================================
   Ordenar validas (tu lógica intacta)
   ============================================================ */
function ordenarValidasSegunModo() {
  const { validas, tasas, modo } = state;

  // ✅ fallback: si validas está vacío, usa tasas
  const base = (Array.isArray(validas) && validas.length)
    ? validas
    : (Array.isArray(tasas) ? tasas : []);

  // solo numéricas
  const arr = base.filter(c => Number.isFinite(c?.compra) && Number.isFinite(c?.venta));

  const { have, want } = getHaveWant();

  if (modo === 'recibir') {
    if (have === 'USD' && want === 'PEN') {
      arr.sort((a, b) => b.compra - a.compra);
    } else if (have === 'PEN' && want === 'USD') {
      arr.sort((a, b) => a.venta - b.venta);
    }
  } else {
    if (want === 'USD' && have === 'PEN') {
      arr.sort((a, b) => a.venta - b.venta);
    } else if (want === 'PEN' && have === 'USD') {
      arr.sort((a, b) => b.compra - a.compra);
    }
  }

  return arr;
}

/* ============================================================
   Encabezado tabla (ahora 1 sola columna: Resultado)
   ============================================================ */
function actualizarEncabezadosTabla() {
  const thR = $('#columna-resultado');
  if (!thR) return;

  const { modo } = state;
  const { have, want } = getHaveWant();

  let label = 'Resultado';

  if (modo === 'recibir') {
    if (have === 'PEN' && want === 'USD') label = '$ Recibidos';
    if (have === 'USD' && want === 'PEN') label = 'S/. Recibidos';
  } else {
    if (have === 'PEN' && want === 'USD') label = 'S/. Necesarios';
    if (have === 'USD' && want === 'PEN') label = '$ Necesarios';
  }

  thR.textContent = label;

  const table = document.querySelector('.tabla-casas');
  if (table) {
    table.classList.remove('usa-compra', 'usa-venta');

    const { modo } = state;
    const { have, want } = getHaveWant();

    const usaCompra =
      (modo === 'recibir' && have === 'USD' && want === 'PEN') ||
      (modo === 'necesito' && have === 'USD' && want === 'PEN');

    const usaVenta =
      (modo === 'recibir' && have === 'PEN' && want === 'USD') ||
      (modo === 'necesito' && have === 'PEN' && want === 'USD');

    if (usaCompra) table.classList.add('usa-compra');
    if (usaVenta) table.classList.add('usa-venta');
  }

}

/* ============================================================
   Recalcular celdas (misma fórmula, 1 sola celda)
   ============================================================ */
export function recalcularCeldas() {
  const { monto, modo } = state;
  if (!monto || monto <= 0) return;

  const { have, want } = getHaveWant();

  document.querySelectorAll('.fila-casa').forEach(fila => {
    const compra = parseFloat(fila.dataset.compra);
    const venta = parseFloat(fila.dataset.venta);

    const celR = fila.querySelector('.resultado');
    if (!celR) return;

    celR.textContent = '-';

    if (!Number.isFinite(compra) || !Number.isFinite(venta)) return;

    // Recibir:
    // - PEN -> USD: recibes USD = monto / venta
    // - USD -> PEN: recibes PEN = monto * compra
    if (modo === 'recibir') {
      if (have === 'PEN' && want === 'USD') {
        celR.textContent = moneyFmt(monto / venta, 'USD');
      } else if (have === 'USD' && want === 'PEN') {
        celR.textContent = moneyFmt(monto * compra, 'PEN');
      }
      return;
    }

    // Necesito:
    // - PEN -> USD: soles necesarios = monto * venta  (tu lógica original)
    // - USD -> PEN: dólares necesarios = monto / compra (tu lógica original)
    if (have === 'PEN' && want === 'USD') {
      celR.textContent = moneyFmt(monto * venta, 'PEN');
    } else if (have === 'USD' && want === 'PEN') {
      celR.textContent = moneyFmt(monto / compra, 'USD');
    }
  });
}

