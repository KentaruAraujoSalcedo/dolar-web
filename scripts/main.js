// ==============================
// File: scripts/main.js
// ==============================
import { getEls } from './ui/els.js';
import { state, setState } from './state.js';
import {
  cargarData,
  cargarSunatUltimos7Dias
} from './data.js';
import { initModal } from "./ui/modal.js";
import { initRankingModalUI, refreshRankingModal } from "./ui/rankingModal.js";
import { renderBestHeader } from './ui/bestHeader.js';
import { renderHomeStats, loadHomeTrend } from './home-redesign.js';

import {
  initStaticUI,
  bindEvents,
  renderTabla,
  recalcularCeldas,
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

    // 3) Cargar datos. Una caída de la API no debe inutilizar el conversor
    //    ni impedir mostrar una explicación visible del problema.
    const estadoDatos = document.getElementById('estado-datos');
    try {
      await cargarData();
      pintarActualizado(state.meta);
      if (estadoDatos) estadoDatos.hidden = true;
    } catch (error) {
      console.error('No se pudieron cargar cotizaciones:', error);
      const fecha = document.getElementById('fecha');
      if (fecha) fecha.textContent = 'sin datos';
      if (estadoDatos) {
        estadoDatos.textContent = 'No pudimos actualizar las cotizaciones en este momento. Vuelve a intentarlo más tarde y verifica la tasa directamente con la entidad antes de operar.';
        estadoDatos.hidden = false;
      }
    }

    // 5) Render inicial
    renderAll();

    // El histórico de 7 días se alimenta de datos SUNAT reales, sin
    // bloquear la interacción con el conversor y el ranking.
    void loadHomeTrend();

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

        // ✅ Si aún no tenemos historial, lo pedimos 1 sola vez y lo cacheamos en state
        if (!Array.isArray(state.sunat7) || state.sunat7.length === 0) {
          const hist = await cargarSunatUltimos7Dias();
          setState({ sunat7: hist });
        }

        mod.renderSunatChartFromState();
      } catch (err) {
        console.error(err);
        alert("No se pudo cargar el gráfico. Intenta nuevamente.");
      }
    });

    // 7) Eventos reactivos

    bindEvents({
      onChange: ({ type } = {}) => {
        syncMontoUI();
        renderSunat();

        if (type === 'amount') {
          // ✅ no reconstruyas filas; solo recalcula "Resultado"
          recalcularCeldas();
        } else {
          // ✅ si cambió modo/moneda/filtros, ahí sí reconstruye
          renderTabla();
        }

        renderResultadoConversor();
        renderBestDeal();
        renderBestHeader(state);
        renderHomeStats();

        refreshRankingModal({ onlyRecalc: type === 'amount' });
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
      renderBestHeader(state);
      renderHomeStats();
    }

    function pintarActualizado(meta) {
      const els = getEls();

      if (!els.fecha || !els.hora || !els.updatedAt) return;
      if (!meta?.run_at_utc) {
        els.fecha.textContent = 'sin datos';
        els.hora.textContent = '';
        return;
      }

      const d = new Date(meta.run_at_utc);
      if (!Number.isFinite(d.getTime())) return;

      els.fecha.textContent = d.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Lima',
      });

      els.hora.textContent = d.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Lima',
      });

      els.updatedAt.setAttribute('datetime', d.toISOString());
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