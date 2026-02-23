// ==============================
// File: scripts/ui/conversor.js
// ==============================

import { state, isReadySunat } from '../state.js';
import { $ } from './dom.js';
import { moneyFmt } from './format.js';

/* ============================================================
   Resultado conversor (misma fórmula)
   + Copy más claro y “oficial”
   ============================================================ */

export function renderResultadoConversor() {
  const out = $('#resultado-modern');
  if (!out) return;

  const { modo, monto, monedaTengo, monedaQuiero, sunat } = state;
  let texto = '';

  if (!isReadySunat()) {
    texto = 'SUNAT no tiene tipo de cambio disponible en este momento.';
  } else if (!Number.isFinite(monto) || monto <= 0) {
    texto = 'Ingresa un monto válido para calcular.';
  } else if (monedaTengo === monedaQuiero) {
    texto = 'Elige monedas diferentes para calcular.';
  }

  // MODO: RECIBIR (¿Cuánto obtengo?)
  else if (modo === 'recibir') {
    // Tengo USD -> obtengo PEN: uso COMPRA
    if (monedaTengo === 'USD') {
      texto = `Según el tipo de cambio SUNAT, obtendrías aprox. ${moneyFmt(monto * sunat.compra, 'PEN')}.`;
    }
    // Tengo PEN -> obtengo USD: uso VENTA
    else {
      texto = `Según el tipo de cambio SUNAT, obtendrías aprox. ${moneyFmt(monto / sunat.venta, 'USD')}.`;
    }
  }

  // MODO: NECESITO (¿Cuánto necesito?)
  else {
    // Tengo PEN (quiero USD): calculo USD referencial con COMPRA
    if (monedaTengo === 'PEN') {
      texto = `Según el tipo de cambio SUNAT, necesitarías aprox. ${moneyFmt(monto / sunat.compra, 'USD')}.`;
    }
    // Tengo USD (quiero PEN): calculo PEN referencial con VENTA
    else {
      texto = `Según el tipo de cambio SUNAT, necesitarías aprox. ${moneyFmt(monto * sunat.venta, 'PEN')}.`;
    }
  }

  out.textContent = texto;
}

/* ============================================================
   UI del monto (prefijo + label + placeholder)
   Guía al usuario según el modo para que NO se pierda
   ============================================================ */
export function syncMontoUI() {
  const prefix = $('#prefix-monto');
  const input = $('#monto');
  const label = $('#label-monto');
  if (!prefix || !input) return;

  // Prefijo según moneda que tengo
  const isPEN = state.monedaTengo === 'PEN';
  prefix.textContent = isPEN ? 'S/' : '$';

  // Label y placeholder según el modo (sin meter texto extra abajo)
  // - recibir: el usuario escribe lo que tiene
  // - necesito: el usuario escribe lo que quiere recibir (lo que “necesita”)
  if (label) {
    label.textContent = (state.modo === 'necesito')
      ? 'Ingresa el monto que quieres'
      : 'Ingresa el monto que tienes';
  }

  // Placeholder corto (mejor UX)
  input.placeholder = (state.modo === 'necesito') ? 'Ej: 100' : 'Ej: 100';

  // Clase visual de "vacío" (opcional, por si la usas en CSS)
  const wrap = input.closest?.('.input-with-prefix');
  if (wrap) {
    const empty = !(Number.isFinite(state.monto) && state.monto > 0);
    wrap.classList.toggle('is-empty', empty);
  }
}
