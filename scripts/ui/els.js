// ==============================
// File: scripts/ui/els.js
// Cache central de elementos DOM
// ==============================

let _cache = null;

export function getEls() {
  if (_cache) return _cache;

  const byId = (id) => document.getElementById(id);

  _cache = Object.freeze({
    // Header “mejores”
    bestCompra: byId('best-compra'),
    bestVenta: byId('best-venta'),

    // Meta actualizado
    fecha: byId('fecha'),
    hora: byId('hora'),
    updatedAt: byId('updatedAt'),

    // SUNAT mini + principal
    sunatCompra: byId('sunat-compra'),
    sunatVenta: byId('sunat-venta'),
    miniC: byId('mini-c'),
    miniV: byId('mini-v'),

    // Best deal box
    bestName: byId('best-name'),
    bestBuy: byId('best-buy'),
    bestSell: byId('best-sell'),
    bestNote: byId('best-note'),
    btnIrMejor: byId('btn-ir-mejor'),
    bestLogo: byId('best-logo'),

    // Ranking modal
    rankingModal: byId('rankingModal'),
    rankingBody: byId('rankingBody'),
    rankingLogos: byId('rankingLogos'),
    rkColResultado: byId('rk-col-resultado'),
  });

  return _cache;
}