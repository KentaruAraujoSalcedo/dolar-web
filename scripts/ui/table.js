// ==============================
// File: scripts/ui/table.js
// ==============================

import { state } from '../state.js';
import { $ } from './dom.js';
import { getHaveWant } from './haveWant.js';
import { rateFmt } from './format.js';
import { attachAhorroToWinnerRow } from './savings.js';

import {
  buildCasaCellHTML,
  applyTableRateModeByConverter,
  recalcResultadosEnContainer,
  getResultadoLabel,
} from './tableShared.js';

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

    tr.innerHTML = `
      ${buildCasaCellHTML(c, { content: 'tabla', basePath: BASE_PATH })}

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

  // ✅ Encabezados y clases usa-compra / usa-venta (por conversor)
  actualizarEncabezadosTabla();

  // ✅ Recalcula resultado usando la MISMA fórmula shared (tabla + modal)
  recalcularCeldas();

  // ✅ ahorro winner (tu lógica actual)
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
   Encabezado tabla (1 sola columna: Resultado)
   ============================================================ */
function actualizarEncabezadosTabla() {
  const thR = $('#columna-resultado');
  if (!thR) return;

  // Mantenemos tu label EXACTO (no lo moví aquí para no tocar comportamiento)
  // (Pero si quieres, lo hacemos 100% shared también, dime)
  thR.textContent = getResultadoLabel();

  // ✅ aplica usa-compra/usa-venta igual en tabla (y también puede usarse en modal)
  const table = document.querySelector('.tabla-casas');
  applyTableRateModeByConverter(table);
}

/* ============================================================
   Recalcular celdas (shared)
   ============================================================ */
export function recalcularCeldas() {
  // Recalcula SOLO dentro de la tabla home
  const table = document.querySelector('.tabla-casas');
  if (!table) return;

  recalcResultadosEnContainer(table, '.fila-casa');
}