// ==============================
// File: scripts/ui/tableShared.js
// Shared helpers para tabla home + ranking modal
// - render celda CASA
// - 1 sola fórmula de resultado
// - 1 solo label Resultado
// - 1 sola lógica usa-compra/usa-venta
// - 1 solo pipeline limpio + sort (para consistencia)
// ==============================

import { state } from "../state.js";
import { getHaveWant } from "./haveWant.js";
import { moneyFmt } from "./format.js";
import { getCasaLogoSrc } from "./logos.js";
import { withUTM } from "./utm.js";

/* ============================================================
   Resultado (misma fórmula en todo el sitio)
   ============================================================ */
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

export function recalcResultadosEnContainer(containerEl, rowSelector = ".fila-casa") {
  if (!containerEl) return;

  const rows = containerEl.querySelectorAll(rowSelector);
  rows.forEach((fila) => {
    const compra = Number(fila.dataset.compra);
    const venta = Number(fila.dataset.venta);

    const celR = fila.querySelector(".resultado");
    if (!celR) return;

    celR.textContent = calcResultadoTexto({ compra, venta });
  });
}

/* ============================================================
   Label Resultado (1 sola fuente de verdad)
   ============================================================ */
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

/* ============================================================
   Highlight de columna (usa-compra / usa-venta) según conversor
   ============================================================ */
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

/* ============================================================
   Celda CASA (logo + fallback + UTM)
   ============================================================ */
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
          ${
            logoSrc
              ? `<img src="${logoSrc}" alt="${casaLabel}" loading="lazy" decoding="async">`
              : `<span class="logo-fallback" aria-hidden="true">${casaLabel.slice(0, 2).toUpperCase()}</span>`
          }
        </span>
        <span class="casa-name sr-only">${casaLabel}</span>
        <span class="casa-chevron" aria-hidden="true">▾</span>
      </a>
    </td>
  `;
}

/* ============================================================
   Dataset limpio + sort (consistencia tabla + modal)
   ============================================================ */
export function getCasasValidasLimpias({ fallbackToTasas = false } = {}) {
  const base =
    Array.isArray(state?.validas) && state.validas.length
      ? state.validas
      : (fallbackToTasas && Array.isArray(state?.tasas) ? state.tasas : []);

  return base
    .filter((c) => (c?.source || "").toLowerCase() === "scraper")
    .filter(
      (c) =>
        String(c?.casa || "").toUpperCase() !== "SUNAT" &&
        String(c?.slug || "").toLowerCase() !== "sunat"
    )
    .map((c) => ({
      ...c,
      compra: Number(c?.compra),
      venta: Number(c?.venta),
    }))
    .filter((c) => Number.isFinite(c.compra) && Number.isFinite(c.venta));
}

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

  // sortBy === "auto" (igual que tu criterio de tabla)
  const { modo } = state;
  const { have, want } = getHaveWant();

  if (modo === "recibir") {
    if (have === "USD" && want === "PEN") arr.sort((a, b) => b.compra - a.compra);
    else if (have === "PEN" && want === "USD") arr.sort((a, b) => a.venta - b.venta);
  } else {
    if (want === "USD" && have === "PEN") arr.sort((a, b) => a.venta - b.venta);
    else if (want === "PEN" && have === "USD") arr.sort((a, b) => b.compra - a.compra);
  }

  return arr;
}