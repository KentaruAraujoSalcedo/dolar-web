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
const buyEl  = els.bestBuy;
const sellEl = els.bestSell;
const noteEl = els.bestNote;
const btnEl  = els.btnIrMejor;
const logoEl = els.bestLogo;

  if (!nameEl || !buyEl || !sellEl) return;

  // ✅ pool = validas sin SUNAT
  const filas = (Array.isArray(state.validas) ? state.validas : []).filter(x => !isSunatRow(x));

  // Estado vacío
  if (!filas.length) {
    nameEl.textContent = '—';
    buyEl.textContent = '—';
    sellEl.textContent = '—';
    if (noteEl) noteEl.textContent = '';
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = 'Ir';
      btnEl.onclick = null;
    }
    if (logoEl) {
      logoEl.removeAttribute('src');
      logoEl.setAttribute('alt', '');
    }
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
    nameEl.textContent = '—';
    buyEl.textContent = '—';
    sellEl.textContent = '—';
    if (noteEl) noteEl.textContent = '';
    if (logoEl) {
      logoEl.removeAttribute('src');
      logoEl.setAttribute('alt', '');
    }
    return;
  }

  // Pintar datos
  nameEl.textContent = winner.casa || '—';
  buyEl.textContent = rateFmt(winner.compra);
  sellEl.textContent = rateFmt(winner.venta);

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
      noteEl.textContent = 'Muy similar al tipo SUNAT';
    }
  }


  // Logo
  if (logoEl) {
    const raw = getCasaLogoSrc(winner.casa);
    const src = raw ? (BASE_PATH + raw.replace(/^\//, '')) : '';

    if (src) {
      logoEl.src = src;
      logoEl.setAttribute('alt', winner.casa ? `Logo de ${winner.casa}` : 'Logo');
    } else {
      logoEl.removeAttribute('src');
      logoEl.setAttribute('alt', '');
    }
  }

    // Botón ir a la casa (con UTM)
  if (btnEl) {
    const hasUrl = Boolean(winner.url);

    btnEl.disabled = !hasUrl;
    btnEl.textContent = hasUrl ? `Ir a ${winner.casa}` : 'Ir';

    btnEl.onclick = hasUrl
      ? () => {
          const urlConUTM = withUTM(winner.url, {
            source: 'preciodolarhoy',
            medium: 'referral',
            campaign: 'clickout',
            content: 'best_deal',
          });

          window.open(urlConUTM, '_blank', 'noopener');
        }
      : null;
  }

}
