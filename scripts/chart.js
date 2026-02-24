// ==============================
// File: scripts/chart.js
// ==============================
import { state } from './state.js';
import { rateFmt } from './ui/format.js';

export function renderGraficoHistorico(ultimos7) {
  const canvas = document.getElementById('graficoSunat');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const labels  = ultimos7.map(d => d.fecha);
  const compras = ultimos7.map(d => d.compra);
  const ventas  = ultimos7.map(d => d.venta);

  if (state.chart) state.chart.destroy();

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Compra SUNAT',
          data: compras,
          borderColor: '#16A34A',
          backgroundColor: 'rgba(22,163,74,.08)',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.25
        },
        {
          label: 'Venta SUNAT',
          data: ventas,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,.08)',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, font: { weight: 'bold' } }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y;
              return `${ctx.dataset.label}: S/ ${rateFmt(v)}`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: false,
          ticks: { callback: (v) => `S/ ${v}` },
          grid: { color: 'rgba(0,0,0,.05)' }
        }
      }
    }
  });
}

// ✅ Wrapper coherente con el nuevo sistema: SOLO sunat7
export function renderSunatChartFromState() {
  const hist = state.sunat7 || [];
  if (!Array.isArray(hist) || hist.length === 0) {
    console.warn('No hay SUNAT últimos 7 (sunat7) en state para graficar.');
    return;
  }
  renderGraficoHistorico(hist);
}
