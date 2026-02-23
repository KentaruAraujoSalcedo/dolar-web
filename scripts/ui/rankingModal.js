// ==============================
// File: scripts/ui/rankingModal.js
// ==============================

import { state } from "../state.js";
import { moneyFmt, rateFmt } from "./format.js";
import { getHaveWant } from "./haveWant.js";
import { getCasaLogoSrc, getCasasCatalog } from "./logos.js";
import { withUTM } from "./utm.js";

function $(sel) { return document.querySelector(sel); }

export function initRankingModalUI() {
  const modal = document.getElementById("rankingModal");
  if (!modal) return;

  // Si ya está bindeado: solo refresca contenido (monto/modo puede haber cambiado)
  if (modal.dataset.bound === "1") {
    const mode = modal.dataset.mode || "venta";
    renderRanking(mode);
    renderMeta();
    // logos: si ya existen, no los vuelvas a construir
    const logosBox = document.getElementById("rankingLogos");
    if (logosBox && !logosBox.dataset.built) {
      renderAllLogos();
      logosBox.dataset.built = "1";
    }
    return;
  }

  modal.dataset.bound = "1";

  const controls = document.querySelectorAll("#rankingModal [data-rk]");
  let mode = "venta";
  modal.dataset.mode = mode;

  controls.forEach(btn => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.rk === "compra" ? "compra" : "venta";
      modal.dataset.mode = mode;

      controls.forEach(b => b.setAttribute("aria-selected", b === btn ? "true" : "false"));
      renderRanking(mode);
    });
  });

  // render inicial
  renderRanking(mode);
  renderMeta();

  const logosBox = document.getElementById("rankingLogos");
  if (logosBox && !logosBox.dataset.built) {
    renderAllLogos();
    logosBox.dataset.built = "1";
  }
}

function renderMeta() {
  const meta = $("#rankingMeta");
  const metaAll = $("#rankingAllMeta");
  if (!meta) return;

  const totalTxt = Number.isFinite(state?.meta?.total) ? state.meta.total : "—";
  const validasTxt = Number.isFinite(state?.meta?.validas)
    ? state.meta.validas
    : (Array.isArray(state?.validas) ? state.validas.length : "—");

  meta.textContent = `Monitoreadas: ${totalTxt} · Válidas hoy: ${validasTxt}`;
  if (metaAll) metaAll.textContent = `${totalTxt} casas`;
}

function getRankingArray(mode) {
  const arr = Array.isArray(state?.validas) ? [...state.validas] : [];

  const onlyScraper = arr.filter(c => (c.source || "").toLowerCase() === "scraper");
  const clean = onlyScraper.filter(c => String(c.casa).toUpperCase() !== "SUNAT" && (c.slug ?? "") !== "sunat");

  if (mode === "compra") clean.sort((a, b) => (b.compra ?? 0) - (a.compra ?? 0));
  else clean.sort((a, b) => (a.venta ?? 999) - (b.venta ?? 999));

  return clean;
}

function renderRanking(mode) {
  const tbody = document.getElementById("rankingBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filas = getRankingArray(mode);

  for (const c of filas) {
    const tr = document.createElement("tr");
    tr.className = "fila-casa";
    tr.dataset.compra = c.compra;
    tr.dataset.venta = c.venta;

    const casaLabel = String(c.casa || "").trim() || "Casa de cambio";
    const logoSrc = getCasaLogoSrc(c.casa) || null;

    const urlConUTM = c.url
      ? withUTM(c.url, {
          source: "preciodolarhoy",
          medium: "referral",
          campaign: "clickout",
          content: "ranking_modal",
        })
      : "";

    tr.innerHTML = `
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

      <td class="compra">${rateFmt(c.compra)}</td>
      <td class="venta">${rateFmt(c.venta)}</td>
      <td class="resultado">-</td>
    `;

    tbody.appendChild(tr);
  }

  // depende del conversor
  setResultadoLabelRankingModal();
  recalcularResultadoEnModal();

  // depende del toggle compra/venta
  setRankingHeaderHighlight(mode);
}

function recalcularResultadoEnModal() {
  const { monto, modo } = state;
  if (!monto || monto <= 0) return;

  const { have, want } = getHaveWant();
  const rows = document.querySelectorAll("#rankingModal .fila-casa");

  rows.forEach(fila => {
    const compra = parseFloat(fila.dataset.compra);
    const venta = parseFloat(fila.dataset.venta);

    const celR = fila.querySelector(".resultado");
    if (!celR) return;

    celR.textContent = "-";
    if (!Number.isFinite(compra) || !Number.isFinite(venta)) return;

    if (modo === "recibir") {
      if (have === "PEN" && want === "USD") celR.textContent = moneyFmt(monto / venta, "USD");
      else if (have === "USD" && want === "PEN") celR.textContent = moneyFmt(monto * compra, "PEN");
      return;
    }

    if (have === "PEN" && want === "USD") celR.textContent = moneyFmt(monto * venta, "PEN");
    else if (have === "USD" && want === "PEN") celR.textContent = moneyFmt(monto / compra, "USD");
  });
}

function renderAllLogos() {
  const box = document.getElementById("rankingLogos");
  if (!box) return;
  box.innerHTML = "";

  const catalog = typeof getCasasCatalog === "function" ? getCasasCatalog() : [];

  for (const item of catalog) {
    const { casa, url, logo } = item;

    const a = document.createElement("a");
    a.title = casa;

    if (url) {
      a.href = withUTM(url, {
        source: "preciodolarhoy",
        medium: "referral",
        campaign: "clickout",
        content: "logos_modal",
      });
      a.target = "_blank";
      a.rel = "noopener sponsored";
    } else {
      // sin URL: queda visual pero no clickeable
      a.setAttribute("aria-disabled", "true");
    }

    a.innerHTML = logo
      ? `<img src="${logo}" alt="${casa}" loading="lazy" decoding="async">`
      : `<span class="logo-fallback" aria-hidden="true">${String(casa).slice(0, 2).toUpperCase()}</span>`;

    box.appendChild(a);
  }
}

/* ============================================================
   Encabezado: Resultado (depende del conversor)
   ============================================================ */
function setResultadoLabelRankingModal() {
  const thR = document.getElementById("rk-col-resultado");
  if (!thR) return;

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

  thR.textContent = label;
}

/* ============================================================
   Highlight header (depende SOLO del toggle del modal)
   ============================================================ */
function setRankingHeaderHighlight(mode){
  const table = document.querySelector("#rankingModal .tabla-casas");
  if (!table) return;

  // Reutiliza EXACTO el sistema de la tabla principal
  table.classList.remove("usa-compra", "usa-venta");
  table.classList.add(mode === "compra" ? "usa-compra" : "usa-venta");
}

/* ============================================================

   ============================================================ */

export function refreshRankingModalIfOpen(){
  const modal = document.getElementById("rankingModal");
  if (!modal) return;
  if (modal.getAttribute("aria-hidden") !== "false") return;

  try {
    // 1) label del header Resultado (depende del conversor)
    setResultadoLabelRankingModal();

    // 2) recalcula resultado de filas ya renderizadas
    recalcularResultadoEnModal();

    // 3) repaint header highlight según el toggle guardado
    const mode = modal.dataset.mode || "venta";
    setRankingHeaderHighlight(mode);
  } catch (e) {
    console.warn("refreshRankingModalIfOpen falló:", e);
  }
}
