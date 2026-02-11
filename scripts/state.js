// ==============================
// File: scripts/state.js
// ==============================

export const state = {
  // ==========================
  // DATA
  // ==========================
  tasas: [],
  validas: [],
  invalidas: [],

  mejorCompra: null,
  mejorVenta: null,

  winnerCompra: null,
  winnerVenta: null,

  // SUNAT
  sunat: {
    compra: null,
    venta: null,
    fecha: null,
    source: null,
  },

  // ==========================
  // UI / INTERACCIÓN
  // ==========================
  modo: 'recibir',
  monedaTengo: 'USD',
  monedaQuiero: 'PEN',
  monto: NaN,

  soloVerificadas: false,
  ready: false,

  // ==========================
  // RUNTIME
  // ==========================
  chart: null,
  meta: null,

  // ✅ cache de SUNAT últimos 7 (derivado de sunat-mensual)
  sunat7: null
};

export const setState = (patch) => Object.assign(state, patch);

export const isReadySunat = () =>
  Number.isFinite(state.sunat.compra) &&
  Number.isFinite(state.sunat.venta);
