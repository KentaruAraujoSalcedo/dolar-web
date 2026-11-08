/* Calculadoras SEO, independientes del comparador de portada.
   Solo consultan /api/data (API PUBLICA) y no revelan el KV privado. */
import { CONFIG } from './config.js';

const tool = document.querySelector('[data-conversion-tool]');
if (tool) {
  const mode = tool.dataset.mode;
  const isSolesToDollars = mode === 'pen-usd';
  const input = tool.querySelector('[data-amount]');
  const output = tool.querySelector('[data-result]');
  const rateEl = tool.querySelector('[data-rate]');
  const updatedEl = tool.querySelector('[data-updated]');
  let rate = null;
  let casa = '';

  const currency = new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: isSolesToDollars ? 'USD' : 'PEN',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  const rateFormat = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 3, maximumFractionDigits: 4
  });

  function recalculate() {
    const amount = Number(input.value);
    if (input.value.trim() === '' || !Number.isFinite(amount) || amount <= 0 || amount > 1e12) {
      output.textContent = 'Ingresa un monto válido';
      return;
    }
    output.textContent = rate == null
      ? 'Tasa no disponible'
      : currency.format(isSolesToDollars ? amount / rate : amount * rate);
  }
  input.addEventListener('input', recalculate);

  function validRate(value) {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) && n > 0 && n < 1000 ? n : null;
  }
  function selectBestRate(resumen) {
    const key = isSolesToDollars ? 'venta' : 'compra';
    const primary = isSolesToDollars ? resumen?.mejorVenta : resumen?.mejorCompra;
    const primaryRate = validRate(primary?.[key]);
    if (primaryRate != null) return { casa: String(primary.casa || 'Casa de cambio'), rate: primaryRate };
    const candidates = Array.isArray(resumen?.todas) ? resumen.todas : [];
    const rates = candidates
      .map(item => ({ casa: String(item?.casa || 'Casa de cambio'), rate: validRate(item?.[key]) }))
      .filter(item => item.rate != null);
    if (!rates.length) return null;
    rates.sort((a,b) => isSolesToDollars ? a.rate - b.rate : b.rate - a.rate);
    return rates[0];
  }
  function showUpdated(value) {
    if (typeof value !== 'string' || !value.trim()) {
      updatedEl.textContent = 'Fecha de actualización no disponible.';
      return;
    }
    const d = new Date(value);
    if (Number.isNaN(d.valueOf())) {
      updatedEl.textContent = 'Fecha de actualización no disponible.';
      return;
    }
    const formatted = new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima'
    }).format(d);
    updatedEl.textContent = `Última actualización de datos: ${formatted} (hora de Perú).`;
  }
  async function loadRate() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/data`, {
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const best = selectBestRate(payload?.resumen);
      if (!best) throw new Error('Cotizaciones no disponibles');
      rate = best.rate;
      casa = best.casa;
      rateEl.textContent = `${isSolesToDollars ? 'Venta' : 'Compra'}: S/ ${rateFormat.format(rate)} por USD · ${casa}.`;
      showUpdated(payload.updated_at);
    } catch (_) {
      rate = null;
      rateEl.textContent = 'No se pudo consultar una tasa pública válida. Vuelve a intentarlo más tarde.';
      updatedEl.textContent = 'No mostramos una conversión estimada sin una tasa disponible.';
    } finally {
      clearTimeout(timeout);
      recalculate();
    }
  }
  recalculate();
  loadRate();
}
