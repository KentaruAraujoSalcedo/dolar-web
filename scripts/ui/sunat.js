// ==============================
// File: scripts/ui/sunat.js
// ==============================

import { state, isReadySunat } from '../state.js';
import { rateFmt } from './format.js';

/* ============================================================
   SUNAT
   ============================================================ */
export function renderSunat() {
  const c = document.getElementById('sunat-compra');
  const v = document.getElementById('sunat-venta');
  if (!c || !v) return;

  if (isReadySunat()) {
    c.textContent = rateFmt(state.sunat.compra);
    v.textContent = rateFmt(state.sunat.venta);
  } else {
    c.textContent = '–';
    v.textContent = '–';
  }

  // Mini-SUNAT en conversor
  const mc = document.getElementById('mini-c');
  const mv = document.getElementById('mini-v');

  if (mc && mv) {
    if (isReadySunat()) {
      mc.textContent = rateFmt(state.sunat.compra);
      mv.textContent = rateFmt(state.sunat.venta);
    } else {
      mc.textContent = '–';
      mv.textContent = '–';
    }
  }
}