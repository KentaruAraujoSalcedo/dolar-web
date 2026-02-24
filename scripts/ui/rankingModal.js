// ==============================
// File: scripts/ui/rankingModal.js
// (SIN botones de ranking compra/venta)
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

  // Marcar como inicializado (sirve para refreshRankingModal)
  modal.dataset.bound = "1";

  renderRankingAuto();
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

function renderRankingAuto() {
  const tbody = document.getElementById("rankingBody");
  if (!tbody) return;

  const sortMode = getRecommendedSortMode();
  const filas = sortCasas(getCasasValidasLimpias({ fallbackToTasas: false }), sortMode);

  const frag = document.createDocumentFragment();

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

    frag.appendChild(tr);
  }

  // ✅ Un solo update DOM
  tbody.replaceChildren(frag);

  const thR = document.getElementById("rk-col-resultado");
  if (thR) thR.textContent = getResultadoLabel();

  recalcResultadosEnContainer(document.getElementById("rankingModal"));

  const table = document.querySelector("#rankingModal .tabla-casas");
  applyTableRateModeByConverter(table);
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

  const catalog = typeof getCasasCatalog === "function" ? getCasasCatalog() : [];
  const frag = document.createDocumentFragment();

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

    frag.appendChild(a);
  }

  // ✅ Un solo update DOM
  box.replaceChildren(frag);
}

export function refreshRankingModal({ onlyRecalc = false } = {}) {
  const modal = document.getElementById("rankingModal");
  if (!modal) return;

  // Si nunca se abrió, no hagas nada
  if (modal.dataset.bound !== "1") return;

  // ✅ Si está cerrado, no reproceses nada
  if (modal.getAttribute("aria-hidden") === "true") return;

  if (onlyRecalc) {
    recalcResultadosEnContainer(modal);
  } else {
    renderRankingAuto();
    renderMeta();
  }
}

export function recalcRankingResultadosOnly() {
  const modal = document.getElementById("rankingModal");
  if (!modal) return;
  recalcResultadosEnContainer(modal);
}
