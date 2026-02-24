// ==============================
// File: scripts/ui/sunat.js
// ==============================

import { state, isReadySunat } from '../state.js';

/* ============================================================
   SUNAT (intacto)
   ============================================================ */
export function renderSunat() {
  const c = document.getElementById('sunat-compra');
  const v = document.getElementById('sunat-venta');
  if (!c || !v) return;

  if (isReadySunat()) {
    c.textContent = state.sunat.compra.rateFmt();
    v.textContent = state.sunat.venta.rateFmt();
  } else {
    c.textContent = '–';
    v.textContent = '–';
  }

  // Mini-SUNAT en conversor
  const mc = document.getElementById('mini-c');
  const mv = document.getElementById('mini-v');
  if (mc && mv) {
    if (isReadySunat()) {
      mc.textContent = state.sunat.compra.rateFmt();
      mv.textContent = state.sunat.venta.rateFmt();
    } else {
      mc.textContent = '–';
      mv.textContent = '–';
    }
  }
}

