// ==============================
// File: scripts/main.js
// ==============================

import { state, setState } from './state.js';
import {
  cargarData,
  cargarSunatUltimos7Dias
} from './data.js';
import { initModal } from "./ui/modal.js";
import { initRankingModalUI, refreshRankingModal } from "./ui/rankingModal.js";

import {
  initStaticUI,
  bindEvents,
  renderTabla,
  renderSunat,
  renderResultadoConversor,
  renderBestDeal,
  syncMontoUI
} from './ui/index.js';

window.addEventListener('DOMContentLoaded', init);

let chartJsLoadingPromise = null;

function loadChartJsOnce() {
  if (window.Chart) return Promise.resolve();
  if (chartJsLoadingPromise) return chartJsLoadingPromise;

  chartJsLoadingPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar Chart.js"));
    document.head.appendChild(s);
  });

  return chartJsLoadingPromise;
}

async function init() {
  try {

    // 1) UI estática (fallback)
    initStaticUI();

    // Modal SUNAT
    initModal({
      modalId: "chartModal",
      openerSelector: "#btn-open-chart",
    });

    // Modal ranking
    initModal({
      modalId: "rankingModal",
      openerSelector: "#btn-open-ranking",
      onOpen: () => {
        initRankingModalUI();
      }
    });

    // Autofocus SOLO desktop
    const montoFocus = document.getElementById("monto");
    if (montoFocus && window.matchMedia("(min-width: 700px)").matches) {
      montoFocus.focus();
    }

    // 2) Estado inicial desde DOM
    const modoIni =
      document.querySelector('input[name="modo"]:checked')?.value || 'recibir';

    const monedaTengoIni =
      document.getElementById('moneda-tengo')?.value || 'USD';

    const monedaQuieroIni =
      document.getElementById('moneda-quiero')?.value || 'PEN';

    const montoIniRaw = document.getElementById('monto')?.value ?? '';
    const montoIni = parseFloat(String(montoIniRaw).replace(',', '.'));

    setState({
      modo: modoIni,
      monedaTengo: monedaTengoIni,
      monedaQuiero: monedaQuieroIni,
      monto: Number.isFinite(montoIni) ? montoIni : NaN
    });

    // 3) Cargar datos
    await cargarData();
    pintarActualizado(state.meta);

    // 4) Header mejores valores
    pintarMejoresHeader();

    // 5) Render inicial
    renderAll();

// 6) Modal gráfico (lazy-load Chart.js + tu chart.js)
const btnOpenChart = document.getElementById("btn-open-chart");

let chartModulePromise = null;

function loadChartModuleOnce() {
  if (chartModulePromise) return chartModulePromise;

  chartModulePromise = (async () => {
    // 1) Cargar Chart.js (CDN) solo cuando se necesite
    await loadChartJsOnce();

    // 2) Importar tu módulo chart.js solo cuando se necesite
    // (esto evita que el bundle inicial ejecute cosas del gráfico)
    const mod = await import("./chart.js");
    return mod;
  })();

  return chartModulePromise;
}

btnOpenChart?.addEventListener("click", async () => {
  try {
    const mod = await loadChartModuleOnce();
    await mod.renderSunatChartFromState();
  } catch (err) {
    console.error(err);
    alert("No se pudo cargar el gráfico. Intenta nuevamente.");
  }
});

    // 7) Eventos reactivos
    bindEvents({
      onChange: () => {
        syncMontoUI();
        renderSunat();
        renderTabla();
        renderResultadoConversor();
        renderBestDeal();
        pintarMejoresHeader();

        // Refresca ranking si ya fue inicializado (abierto al menos 1 vez)
        refreshRankingModal();
      },
    });

    // ==============================
    // Helpers internos
    // ==============================

    function renderAll() {
      syncMontoUI();
      renderSunat();
      renderTabla();
      renderResultadoConversor();
      renderBestDeal();
    }

    function pintarMejoresHeader() {
      const bc = document.getElementById('best-compra');
      const bv = document.getElementById('best-venta');

      if (bc) {
        bc.textContent = Number.isFinite(state.mejorCompra)
          ? state.mejorCompra.toFixed(3)
          : '—';
      }

      if (bv) {
        bv.textContent = Number.isFinite(state.mejorVenta)
          ? state.mejorVenta.toFixed(3)
          : '—';
      }
    }

    function pintarActualizado(meta) {
      const fechaEl = document.getElementById('fecha');
      const horaEl = document.getElementById('hora');
      const timeEl = document.getElementById('updatedAt');

      if (!fechaEl || !horaEl || !timeEl) return;
      if (!meta?.run_at_utc) return;

      const d = new Date(meta.run_at_utc);

      fechaEl.textContent = d.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      horaEl.textContent = d.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      });

      timeEl.setAttribute('datetime', d.toISOString());
    }

    // ==============================
    // SEO Tabs
    // ==============================

    (function initSeoTabs() {
      const root = document.querySelector('.seo-tabs');
      if (!root) return;

      const tabs = Array.from(root.querySelectorAll('[data-seo-tab]'));
      const panels = Array.from(root.querySelectorAll('[data-seo-panel]'));
      const btnPrev = root.querySelector('[data-seo-prev]');
      const btnNext = root.querySelector('[data-seo-next]');

      let idx = 0;

      const setActive = (nextIdx) => {
        idx = (nextIdx + tabs.length) % tabs.length;

        tabs.forEach((t, i) => {
          const active = i === idx;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        panels.forEach((p, i) => {
          const active = i === idx;
          p.classList.toggle('is-active', active);
          if (active) p.removeAttribute('hidden');
          else p.setAttribute('hidden', '');
        });
      };

      tabs.forEach((t) => {
        t.addEventListener('click', () => {
          setActive(Number(t.dataset.seoTab));
        });
      });

      btnPrev?.addEventListener('click', () => setActive(idx - 1));
      btnNext?.addEventListener('click', () => setActive(idx + 1));

      setActive(0);
    })();

  } catch (e) {
    console.error('Error inicializando la app:', e);
  }
}