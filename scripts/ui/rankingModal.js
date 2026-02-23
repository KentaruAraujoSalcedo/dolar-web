// ==============================
// File: scripts/ui/rankingModal.js
// ==============================

import { state } from "../state.js";
import { getHaveWant } from "./haveWant.js";
import { rateFmt } from "./format.js";
import { getCasasCatalog } from "./logos.js";
import { withUTM } from "./utm.js";
import { $ } from "./dom.js";

import {
  buildCasaCellHTML,
  getResultadoLabel,
  applyTableRateModeByConverter,
  recalcResultadosEnContainer,
  getCasasValidasLimpias,
  sortCasas,
} from "./tableShared.js";

export function initRankingModalUI() {
  const modal = document.getElementById("rankingModal");
  if (!modal) return;

  // Ya bindeado: solo refresca contenido
  if (modal.dataset.bound === "1") {
    const mode = modal.dataset.mode || "venta";
    renderRanking(mode);
    renderMeta();
    ensureLogos();
    return;
  }

  modal.dataset.bound = "1";

  const controls = document.querySelectorAll("#rankingModal [data-rk]");

  // 🔹 Modo inicial: recomendado por conversor (UX)
  let mode = getRecommendedRankingMode();
  modal.dataset.mode = mode;
  syncRankingTabsUI(mode);

  controls.forEach((btn) => {
    btn.addEventListener("click", () => {
      // 🔸 Manual: el usuario manda
      mode = btn.dataset.rk === "compra" ? "compra" : "venta";
      modal.dataset.mode = mode;

      syncRankingTabsUI(mode);
      renderRanking(mode);
    });
  });

  // render inicial
  renderRanking(mode);
  renderMeta();
  ensureLogos();
}

function renderMeta() {
  const meta = $("#rankingMeta");
  const metaAll = $("#rankingAllMeta");
  if (!meta) return;

  const totalTxt = Number.isFinite(state?.meta?.total) ? state.meta.total : "—";
  const validasTxt = Number.isFinite(state?.meta?.validas)
    ? state.meta.validas
    : Array.isArray(state?.validas)
      ? state.validas.length
      : "—";

  meta.textContent = `Monitoreadas: ${totalTxt} · Válidas hoy: ${validasTxt}`;
  if (metaAll) metaAll.textContent = `${totalTxt} casas`;
}

function getRankingArray(mode) {
  const filas = getCasasValidasLimpias({ fallbackToTasas: false });
  return sortCasas(filas, mode === "compra" ? "compra" : "venta");
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

    tr.innerHTML = `
      ${buildCasaCellHTML(c, { content: "ranking_modal", basePath: "" })}

      <td class="compra">${rateFmt(c.compra)}</td>
      <td class="venta">${rateFmt(c.venta)}</td>
      <td class="resultado">-</td>
    `;

    tbody.appendChild(tr);
  }

  // Label + cálculo
  setResultadoLabelRankingModal();
  recalcResultadosEnContainer(document.getElementById("rankingModal"));

  // Highlight por conversor (NO por toggle)
  const table = document.querySelector("#rankingModal .tabla-casas");
  applyTableRateModeByConverter(table);
}

function setResultadoLabelRankingModal() {
  const thR = document.getElementById("rk-col-resultado");
  if (!thR) return;
  thR.textContent = getResultadoLabel();
}

function ensureLogos() {
  const box = document.getElementById("rankingLogos");
  if (!box) return;

  if (box.children.length === 0) {
    renderAllLogos();
  }
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
      a.setAttribute("aria-disabled", "true");
    }

    a.innerHTML = logo
      ? `<img src="${logo}" alt="${casa}" loading="lazy" decoding="async">`
      : `<span class="logo-fallback" aria-hidden="true">${String(casa).slice(0, 2).toUpperCase()}</span>`;

    box.appendChild(a);
  }
}

/**
 * Llamar desde main.js en cada cambio del conversor
 * (swap, modo, monedas, monto).
 * - Si el modal ya fue inicializado (se abrió alguna vez), lo mantiene consistente.
 */
export function refreshRankingModal() {
  const modal = document.getElementById("rankingModal");
  if (!modal) return;

  if (modal.dataset.bound !== "1") return;

  // 🔹 Si el usuario eligió manualmente un modo, lo respetamos...
  // ...PERO si cambió el conversor, alineamos a recomendado.
  // Para detectar cambio real, guardamos la "firma" del conversor.
  const sigNow = getConverterSignature();
  const sigPrev = modal.dataset.convSig || "";

  if (sigNow !== sigPrev) {
    const recommended = getRecommendedRankingMode();
    modal.dataset.mode = recommended;
    syncRankingTabsUI(recommended);
  }

  modal.dataset.convSig = sigNow;

  const mode = modal.dataset.mode || "venta";
  renderRanking(mode);
  renderMeta();
  ensureLogos();
}

function getRecommendedRankingMode() {
  const { modo } = state;
  const { have, want } = getHaveWant();

  const usaCompra =
    (modo === "recibir" && have === "USD" && want === "PEN") ||
    (modo === "necesito" && have === "USD" && want === "PEN");

  const usaVenta =
    (modo === "recibir" && have === "PEN" && want === "USD") ||
    (modo === "necesito" && have === "PEN" && want === "USD");

  if (usaCompra) return "compra";
  if (usaVenta) return "venta";
  return "venta";
}

function getConverterSignature() {
  const { modo, monedaTengo, monedaQuiero } = state;
  return `${modo}|${monedaTengo}|${monedaQuiero}`;
}

function syncRankingTabsUI(mode) {
  const controls = document.querySelectorAll("#rankingModal [data-rk]");
  controls.forEach((btn) => {
    const isActive = btn.dataset.rk === mode;
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}