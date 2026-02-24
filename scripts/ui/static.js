// ==============================
// File: scripts/ui/static.js
// ==============================

import { $ } from './dom.js';
import { ensureOppositeSelect, syncAdornmentAndChips } from './labels.js';

export function initStaticUI() {
  // Moneda quiero siempre opuesta a tengo
  const selTengo = $('#moneda-tengo');
  const selQuiero = $('#moneda-quiero');
  if (selTengo && selQuiero) {
    selQuiero.disabled = true; // controlado por JS
    ensureOppositeSelect(selTengo, selQuiero);
  }

  // Símbolo/chips coherentes
  syncAdornmentAndChips();
}