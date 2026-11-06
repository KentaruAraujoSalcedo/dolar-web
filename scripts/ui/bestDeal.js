// ==============================
// File: scripts/ui/bestDeal.js
// ==============================
import { state } from '../state.js';
import { getHaveWant } from './haveWant.js';
import { rateFmt, moneyFmt } from './format.js';
import { getCasaLogoSrc } from './logos.js';
import { withUTM } from './utm.js';
import { getEls } from './els.js';

// ⚠️ GitHub Pages: si tu repo es /precio-dolar-hoy/, pon '/precio-dolar-hoy/'
const BASE_PATH = '';

// ✅ helper para excluir SUNAT (y variaciones)
function isSunatRow(x) {
  const casa = String(x?.casa ?? '').trim().toUpperCase();
  const slug = String(x?.slug ?? '').trim().toLowerCase();
  return casa === 'SUNAT' || slug === 'sunat';
}

export function renderBestDeal() {
  // IDs reales de tu HTML ✅
  const els = getEls();
  const nameEl = els.bestName;
  const buyEl = els.bestBuy;
  const sellEl = els.bestSell;
  const noteEl = els.bestNote;
  const btnEl = els.btnIrMejor;
  const logoEl = els.bestLogo;
  const operationEl = document.getElementById('best-operation');

  // Se muestra el logo o, como alternativa si falta la imagen, el nombre.
  function setBrandImage(src, name) {
    if (!logoEl) return;
    const container = logoEl.closest('.best-deal__identity');
    const useFallback = () => {
      logoEl.hidden = true;
      container?.classList.add('is-logo-fallback');
    };
    if (!src) {
      logoEl.removeAttribute('src');
      useFallback();
      return;
    }
    logoEl.onload = () => {
      logoEl.hidden = false;
      container?.classList.remove('is-logo-fallback');
    };
    logoEl.onerror = useFallback;
    logoEl.alt = name ? `Logo de ${name}` : '';
    logoEl.src = src;
    if (logoEl.complete && logoEl.naturalWidth > 0) {
      logoEl.hidden = false;
      container?.classList.remove('is-logo-fallback');
    }
  }

  if (!nameEl || !buyEl || !sellEl) return;

  // ✅ pool = validas sin SUNAT
  const filas = (Array.isArray(state.validas) ? state.validas : []).filter(x => !isSunatRow(x));

  // Sin cotizaciones: no inventar casas ni prometer enlaces.
  if (!filas.length) {
    nameEl.textContent = 'Sin cotizaciones';
    buyEl.textContent = '—';
    sellEl.textContent = '—';
    if (noteEl) noteEl.textContent = '';
    if (operationEl) operationEl.textContent = 'Esperando datos';
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = 'Enlace no disponible';
      btnEl.onclick = null;
    }
    setBrandImage(null, '');
    return;
  }

  const { modo } = state;
  const { have, want } = getHaveWant();

  const paintCompra =
    (modo === 'recibir' && have === 'USD' && want === 'PEN') ||
    (modo === 'necesito' && want === 'PEN' && have === 'USD');

  const paintVenta =
    (modo === 'recibir' && have === 'PEN' && want === 'USD') ||
    (modo === 'necesito' && want === 'USD' && have === 'PEN');

  // Ganador igual que la tabla:
  // - si importa compra: mayor compra
  // - si importa venta: menor venta
  let winner = null;

  if (paintCompra) {
    winner = filas.reduce((best, x) => {
      if (!best) return x;
      return (x.compra ?? -Infinity) > (best.compra ?? -Infinity) ? x : best;
    }, null);
  } else if (paintVenta) {
    winner = filas.reduce((best, x) => {
      if (!best) return x;
      return (x.venta ?? Infinity) < (best.venta ?? Infinity) ? x : best;
    }, null);
  } else {
    // ✅ fallback: usa el primero (pero ya sin SUNAT)
    winner = filas[0] || null;
  }

  if (!winner) {
    nameEl.textContent = 'Sin cotizaciones';
    buyEl.textContent = '—';
    sellEl.textContent = '—';
    if (noteEl) noteEl.textContent = '';
    if (operationEl) operationEl.textContent = 'Esperando datos';
    if (btnEl) { btnEl.disabled = true; btnEl.onclick = null; }
    setBrandImage(null, '');
    return;
  }

  // Pintar datos
  nameEl.textContent = winner.casa || '—';
  buyEl.textContent = rateFmt(winner.compra);
  sellEl.textContent = rateFmt(winner.venta);
  if (operationEl) operationEl.textContent = paintCompra ? 'Para vender dólares' : paintVenta ? 'Para comprar dólares' : 'Según tu operación';

  // Nota: diferencia vs SUNAT (texto corto)
  if (noteEl) {
    const row = document.querySelector('tr.winner-row');
    const diff = row?.dataset?.ahorroVal ? parseFloat(row.dataset.ahorroVal) : NaN;
    const cur = row?.dataset?.ahorroCur || '';

    if (Number.isFinite(diff) && cur) {
      const abs = moneyFmt(Math.abs(diff), cur);

      if (Math.abs(diff) < 0.01) {
        noteEl.textContent = 'Muy similar al tipo SUNAT';
      }
      else if (state.modo === 'recibir') {
        noteEl.textContent =
          diff > 0
            ? `Recibes ${abs} más que SUNAT`
            : `Recibes ${abs} menos que SUNAT`;
      }
      else {
        // modo = necesito
        noteEl.textContent =
          cur === 'PEN'
            ? (diff > 0
              ? `Pagarías ${abs} más que SUNAT`
              : `Pagarías ${abs} menos que SUNAT`)
            : (diff > 0
              ? `Necesitas ${abs} más que SUNAT`
              : `Necesitas ${abs} menos que SUNAT`);
      }
    } else {
      noteEl.textContent = '';
    }
  }


  // Mostrar una sola marca visual: logo, o nombre de respaldo si no existe.
  const logoSource = getCasaLogoSrc(winner.casa);
  setBrandImage(logoSource ? BASE_PATH + logoSource : null, winner.casa);

  // Botón ir a la casa (con UTM)
  if (btnEl) {
    // Una URL inválida nunca debe abrirse, aunque la API incluya un valor no vacío.
    const safeUrl = withUTM(winner.url, {
      source: 'preciodolarhoy',
      medium: 'referral',
      campaign: 'clickout',
      content: 'best_deal',
    });
    btnEl.disabled = !safeUrl;
    btnEl.textContent = safeUrl ? 'Visitar casa de cambio ↗' : 'Enlace no disponible';
    btnEl.setAttribute('aria-label', safeUrl ? `Visitar ${winner.casa} en una pestaña nueva` : 'Enlace no disponible');
    btnEl.onclick = safeUrl ? () => window.open(safeUrl, '_blank', 'noopener') : null;
  }

}
