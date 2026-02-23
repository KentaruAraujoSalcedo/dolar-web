// ==============================
// File: scripts/ui/rankingModal.js
// ==============================

import { state } from "../state.js";
import { rateFmt } from "./format.js";
import { getCasasCatalog } from "./logos.js";
import { withUTM } from "./utm.js";
import { $ } from "./dom.js";

import {
  buildCasaCellHTML,
  getResultadoLabel,
  applyTableRateModeByConverter,
  recalcResultadosEnContainer,
} from "./tableShared.js";

export function initRankingModalUI() {
  const modal = document.getElementById("rankingModal");
  if (!modal) return;

  // Si ya está bindeado: solo refresca contenido (monto/modo puede haber cambiado)
  if (modal.dataset.bound === "1") {
    const mode = modal.dataset.mode || "venta";
    renderRanking(mode);
    renderMeta();

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

  controls.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.rk === "compra" ? "compra" : "venta";
      modal.dataset.mode = mode;

      controls.forEach((b) =>
        b.setAttribute("aria-selected", b === btn ? "true" : "false")
      );

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
    : Array.isArray(state?.validas)
    ? state.validas.length
    : "—";

  meta.textContent = `Monitoreadas: ${totalTxt} · Válidas hoy: ${validasTxt}`;
  if (metaAll) metaAll.textContent = `${totalTxt} casas`;
}

function getRankingArray(mode) {
  const arr = Array.isArray(state?.validas) ? [...state.validas] : [];

  // 1) Solo scraper + quitar SUNAT
  const clean = arr
    .filter(c => (c.source || "").toLowerCase() === "scraper")
    .filter(c => String(c.casa).toUpperCase() !== "SUNAT" && (c.slug ?? "").toLowerCase() !== "sunat")
    // 2) Coerción a número + filtrar finitos (igual que la tabla principal)
    .map(c => ({
      ...c,
      compra: Number(c.compra),
      venta: Number(c.venta),
    }))
    .filter(c => Number.isFinite(c.compra) && Number.isFinite(c.venta));

  // 3) Orden
  if (mode === "compra") clean.sort((a, b) => b.compra - a.compra);
  else clean.sort((a, b) => a.venta - b.venta);

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

    tr.innerHTML = `
      ${buildCasaCellHTML(c, { content: "ranking_modal", basePath: "" })}

      <td class="compra">${rateFmt(c.compra)}</td>
      <td class="venta">${rateFmt(c.venta)}</td>
      <td class="resultado">-</td>
    `;

    tbody.appendChild(tr);
  }

  // ✅ label y cálculo, iguales a table.js
  setResultadoLabelRankingModal();
  recalcResultadosEnContainer(document.getElementById("rankingModal"));

  // ✅ IMPORTANTE:
  // El highlight visual de columnas debe depender del conversor,
  // igual que en la tabla principal (no del toggle compra/venta).
  // (Si quieres que el toggle cambie el highlight, dime y lo hacemos sin romper la lógica)
  const table = document.querySelector("#rankingModal .tabla-casas");
  applyTableRateModeByConverter(table);

  // si quieres mantener el viejo comportamiento del toggle:
  // setRankingHeaderHighlight(mode);
}

function setResultadoLabelRankingModal() {
  const thR = document.getElementById("rk-col-resultado");
  if (!thR) return;
  thR.textContent = getResultadoLabel();
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