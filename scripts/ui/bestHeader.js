// ==============================
// File: scripts/ui/bestHeader.js
// Header “mejores” (compra/venta)
// ==============================

import { getEls } from './els.js';
import { rateFmt } from './format.js';

export function renderBestHeader({ mejorCompra, mejorVenta }) {
  const els = getEls();

  if (els.bestCompra) {
    els.bestCompra.textContent = Number.isFinite(mejorCompra) ? rateFmt(mejorCompra) : '—';
  }

  if (els.bestVenta) {
    els.bestVenta.textContent = Number.isFinite(mejorVenta) ? rateFmt(mejorVenta) : '—';
  }
}