// ==============================
// File: scripts/ui/tableShared.js
// Shared helpers para tabla home + ranking modal
// - 1 sola fórmula de resultado
// - 1 solo label de Resultado
// - 1 sola lógica de usa-compra / usa-venta
// - 1 solo builder de celda "casa" (logo + UTM + fallback)
// ==============================

import { state } from "../state.js";
import { getHaveWant } from "./haveWant.js";
import { moneyFmt } from "./format.js";
import { getCasaLogoSrc } from "./logos.js";
import { withUTM } from "./utm.js";

// Cache por referencia del array base (state.validas o state.tasas)
const _cleanCasasCache = new WeakMap();

/**
 * Calcula el texto de resultado según monto/modo/have/want y compra/venta.
 * Devuelve string listo para pintar (o "-" si no aplica).
 */
export function calcResultadoTexto({ compra, venta }) {
  const { monto, modo } = state;
  if (!monto || monto <= 0) return "-";

  const { have, want } = getHaveWant();
  if (!Number.isFinite(compra) || !Number.isFinite(venta)) return "-";

  // Recibir:
  // - PEN -> USD: recibes USD = monto / venta
  // - USD -> PEN: recibes PEN = monto * compra
  if (modo === "recibir") {
    if (have === "PEN" && want === "USD") return moneyFmt(monto / venta, "USD");
    if (have === "USD" && want === "PEN") return moneyFmt(monto * compra, "PEN");
    return "-";
  }

  // Necesito:
  // - PEN -> USD: soles necesarios = monto * venta
  // - USD -> PEN: dólares necesarios = monto / compra
  if (have === "PEN" && want === "USD") return moneyFmt(monto * venta, "PEN");
  if (have === "USD" && want === "PEN") return moneyFmt(monto / compra, "USD");

  return "-";
}

/**
 * Label de la columna Resultado (igual que table.js)
 */
export function getResultadoLabel() {
  const { modo } = state;
  const { have, want } = getHaveWant();

  let label = "Resultado";

  if (modo === "recibir") {
    if (have === "PEN" && want === "USD") label = "$ Recibidos";
    if (have === "USD" && want === "PEN") label = "S/. Recibidos";
  } else {
    if (have === "PEN" && want === "USD") label = "S/. Necesarios";
    if (have === "USD" && want === "PEN") label = "$ Necesarios";
  }

  return label;
}

/**
 * Aplica clases usa-compra / usa-venta al <table> según el conversor (igual que tu tabla)
 * OJO: Esto depende del conversor, NO del toggle compra/venta del modal.
 */
export function applyTableRateModeByConverter(tableEl) {
  if (!tableEl) return;

  tableEl.classList.remove("usa-compra", "usa-venta");

  const { modo } = state;
  const { have, want } = getHaveWant();

  const usaCompra =
    (modo === "recibir" && have === "USD" && want === "PEN") ||
    (modo === "necesito" && have === "USD" && want === "PEN");

  const usaVenta =
    (modo === "recibir" && have === "PEN" && want === "USD") ||
    (modo === "necesito" && have === "PEN" && want === "USD");

  if (usaCompra) tableEl.classList.add("usa-compra");
  if (usaVenta) tableEl.classList.add("usa-venta");
}

/**
 * Builder de la celda CASA (logo + fallback + UTM)
 * options.content: para diferenciar en analytics/UTM (tabla, ranking_modal, etc)
 * options.basePath: para GH Pages (si necesitas prefijo de ruta)
 */
export function buildCasaCellHTML(c, { content = "tabla", basePath = "" } = {}) {
  const casaLabel = String(c?.casa || "").trim() || "Casa de cambio";

  const rawLogo = getCasaLogoSrc(c?.casa);
  const logoSrc = rawLogo ? (basePath + rawLogo.replace(/^\//, "")) : null;

  const urlConUTM = c?.url
    ? withUTM(c.url, {
      source: "preciodolarhoy",
      medium: "referral",
      campaign: "clickout",
      content,
    })
    : "";

  return `
    <td class="casa">
      <a class="casa-wrap" href="${urlConUTM}" target="_blank" rel="noopener sponsored" title="${casaLabel}">
        <span class="casa-logo ${logoSrc ? "" : "is-missing"}" aria-hidden="${logoSrc ? "false" : "true"}">
          ${logoSrc
      ? `<img src="${logoSrc}" alt="${casaLabel}" loading="lazy" decoding="async" width="88" height="34">`
      : `<span class="logo-fallback" aria-hidden="true">${casaLabel.slice(0, 2).toUpperCase()}</span>`
    }
        </span>

        <span class="casa-name sr-only">${casaLabel}</span>
        <span class="casa-chevron" aria-hidden="true">▾</span>
      </a>
    </td>
  `;
}

/**
 * Recalcula resultados dentro de un contenedor (tabla home o modal).
 * rowSelector = ".fila-casa"
 */
export function recalcResultadosEnContainer(containerEl, rowSelector = ".fila-casa") {
  if (!containerEl) return;

  const rows = containerEl.querySelectorAll(rowSelector);
  rows.forEach((fila) => {
    const compra = parseFloat(fila.dataset.compra);
    const venta = parseFloat(fila.dataset.venta);

    const celR = fila.querySelector(".resultado");
    if (!celR) return;

    celR.textContent = calcResultadoTexto({ compra, venta });
  });
}

// ============================================================
// Shared: obtener dataset limpio + ordenado (tabla y modal)
// ============================================================

/**
 * Devuelve array limpio:
 * - solo source="scraper"
 * - sin SUNAT
 * - compra/venta numéricas (Number)
 * - filtra solo finitas
 *
 * fallbackToTasas:
 *  - true  => si state.validas está vacío, usa state.tasas
 *  - false => usa solo state.validas
 */
export function getCasasValidasLimpias({ fallbackToTasas = false } = {}) {
  const base =
    Array.isArray(state?.validas) && state.validas.length
      ? state.validas
      : (fallbackToTasas && Array.isArray(state?.tasas) ? state.tasas : []);

  if (!Array.isArray(base) || base.length === 0) return [];

  // ✅ Memo: si ya limpiamos ese mismo array, lo devolvemos tal cual
  const cached = _cleanCasasCache.get(base);
  if (cached) return cached;

  const out = base
    .filter(c => (c?.source || "").toLowerCase() === "scraper")
    .filter(c => String(c?.casa || "").toUpperCase() !== "SUNAT" && String(c?.slug || "").toLowerCase() !== "sunat")
    .map(c => ({
      ...c,
      compra: Number(c?.compra),
      venta: Number(c?.venta),
    }))
    .filter(c => Number.isFinite(c.compra) && Number.isFinite(c.venta));

  _cleanCasasCache.set(base, out);
  return out;
}

/**
 * Ordena casas por:
 * - "auto"  : igual que tu tabla (depende del conversor: state.modo + have/want)
 * - "compra": compra desc (mejor compra primero)
 * - "venta" : venta asc (mejor venta primero)
 */
export function sortCasas(casas, sortBy = "auto") {
  const arr = Array.isArray(casas) ? [...casas] : [];

  if (sortBy === "compra") {
    arr.sort((a, b) => b.compra - a.compra);
    return arr;
  }

  if (sortBy === "venta") {
    arr.sort((a, b) => a.venta - b.venta);
    return arr;
  }

  // sortBy === "auto" (misma lógica que ordenarValidasSegunModo)
  const { modo } = state;
  const { have, want } = getHaveWant();

  if (modo === "recibir") {
    if (have === "USD" && want === "PEN") arr.sort((a, b) => b.compra - a.compra);
    else if (have === "PEN" && want === "USD") arr.sort((a, b) => a.venta - b.venta);
  } else {
    // necesito
    if (want === "USD" && have === "PEN") arr.sort((a, b) => a.venta - b.venta);
    else if (want === "PEN" && have === "USD") arr.sort((a, b) => b.compra - a.compra);
  }

  return arr;
}