// Calculadora unificada con el comparador: utiliza la mejor cotización
// de las casas recibidas. Si no llegan casas válidas, usa SUNAT como
// referencia etiquetada (nunca presenta SUNAT como una casa de cambio).
import { state, isReadySunat } from '../state.js';
import { getCasasValidasLimpias } from './tableShared.js';
import { moneyFmt, rateFmt } from './format.js';

export function calcularCambio({ monto, modo, monedaTengo, compra, venta }) {
  if (!Number.isFinite(monto) || monto <= 0) return null;
  if (!Number.isFinite(compra) || compra <= 0 || !Number.isFinite(venta) || venta <= 0) return null;
  if (monedaTengo === 'USD') {
    // Vendo USD: la casa compra mis dólares a "compra".
    return { valor: modo === 'necesito' ? monto / compra : monto * compra,
      moneda: modo === 'necesito' ? 'USD' : 'PEN', tasa: compra };
  }
  if (monedaTengo === 'PEN') {
    // Compro USD: la casa me vende dólares a "venta".
    return { valor: modo === 'necesito' ? monto * venta : monto / venta,
      moneda: modo === 'necesito' ? 'PEN' : 'USD', tasa: venta };
  }
  return null;
}

export function renderResultadoConversor() {
  const root = document.getElementById('resultado-modern');
  if (!root) return;
  const value = document.getElementById('resultado-valor');
  const kicker = document.getElementById('resultado-kicker');
  const caption = document.getElementById('resultado-caption');

  const casas = getCasasValidasLimpias({ fallbackToTasas: true }).filter(c => c.compra > 0 && c.venta > 0);
  const usandoCasas = casas.length > 0;
  const compra = usandoCasas ? Math.max(...casas.map(c => c.compra)) : state.sunat.compra;
  const venta = usandoCasas ? Math.min(...casas.map(c => c.venta)) : state.sunat.venta;
  const calculo = calcularCambio({ monto: state.monto, modo: state.modo,
    monedaTengo: state.monedaTengo, compra, venta });

  const intro = state.modo === 'necesito' ? 'Necesitarías aproximadamente' : 'Recibirías aproximadamente';
  let texto = '';
  let detalle = '';
  if (!Number.isFinite(state.monto) || state.monto <= 0) {
    texto = 'Ingresa un monto mayor que cero para calcular.';
  } else if (!calculo) {
    texto = 'Todavía no hay tasas disponibles para calcular.';
  } else {
    texto = moneyFmt(calculo.valor, calculo.moneda);
    detalle = usandoCasas
      ? `Mejor tasa de ${state.monedaTengo === 'USD' ? 'compra' : 'venta'} disponible: S/ ${rateFmt(calculo.tasa)} · Estimación, no precio garantizado.`
      : `Calculado con tasa SUNAT de referencia: S/ ${rateFmt(calculo.tasa)}.`;
  }
  if (value && kicker && caption) {
    kicker.textContent = intro;
    value.textContent = calculo ? texto : '—';
    caption.textContent = calculo ? detalle : texto;
  } else {
    root.textContent = calculo ? `${intro} ${texto}. ${detalle}` : texto;
  }
}

export function syncMontoUI() {
  const prefix = document.getElementById('prefix-monto');
  const input = document.getElementById('monto');
  const label = document.getElementById('label-monto');
  const cur = document.getElementById('currency-input-label');
  if (!prefix || !input) return;
  const inputCurrency = state.modo === 'necesito' ? state.monedaQuiero : state.monedaTengo;
  prefix.textContent = inputCurrency === 'PEN' ? 'S/' : '$';
  if (cur) cur.textContent = inputCurrency;
  if (label) label.textContent = state.modo === 'necesito' ? 'Monto que quieres recibir' : 'Monto que tienes';
  input.placeholder = 'Ej: 1000';
  input.closest('.input-with-prefix')?.classList.toggle('is-empty', !(Number.isFinite(state.monto) && state.monto > 0));
}
