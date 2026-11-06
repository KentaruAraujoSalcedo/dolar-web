/** Portada: indicador de cobertura e histórico SUNAT real, sin librerías externas. */
import { state, setState } from './state.js';
import { cargarSunatHistorialMes } from './data.js';
import { getCasasValidasLimpias } from './ui/tableShared.js';

const NS = 'http://www.w3.org/2000/svg';
function svgEl(name, attrs = {}, text) {
  const el = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = String(text);
  return el;
}

export function renderHomeStats() {
  const counter = document.getElementById('casas-cantidad');
  const total = getCasasValidasLimpias({ fallbackToTasas: true }).length;
  if (counter) counter.textContent = total ? `${total} tasas disponibles` : 'Sin cotizaciones';
}

let currentPeriod = 'month';
let monthlyHistory = [];
let hasLoadedHistory = false;

function renderTrend(days) {
  const svg = document.getElementById('trend-svg');
  const placeholder = document.getElementById('trend-placeholder');
  const foot = document.getElementById('trend-foot');
  if (!svg || !placeholder) return;

  const data = (Array.isArray(days) ? days : [])
    .filter(d => d && Number.isFinite(Number(d.venta)) && Number(d.venta) > 0 && d.fecha)
    .map(d => ({ ...d, venta: Number(d.venta), date: new Date(`${String(d.fecha).slice(0, 10)}T12:00:00-05:00`) }))
    .filter(d => Number.isFinite(d.date.getTime()))
    .sort((a,b) => a.date - b.date)
    .slice(-30);

  if (data.length < 2) {
    placeholder.hidden = false;
    placeholder.textContent = 'Aún no hay suficientes datos históricos para mostrar una tendencia.';
    svg.setAttribute('hidden', '');
    if (foot) foot.textContent = 'El histórico mensual solo muestra los registros reales disponibles de SUNAT.';
    return;
  }

  svg.replaceChildren();
  const values = data.map(d => d.venta);
  const low = Math.min(...values), high = Math.max(...values);
  const padding = Math.max(.004, (high - low) * .22);
  const min = low - padding, max = high + padding;
  const left = 53, right = 457, top = 22, bottom = 194;
  const x = i => left + (right - left) * i / (data.length - 1);
  const y = v => top + (max - v) * (bottom - top) / (max - min);

  const defs = svgEl('defs');
  const grad = svgEl('linearGradient', {id:'pdh-trend-fill',x1:0,x2:0,y1:0,y2:1});
  grad.append(svgEl('stop',{offset:'0%','stop-color':'#0ca05b','stop-opacity':'.22'}));
  grad.append(svgEl('stop',{offset:'100%','stop-color':'#0ca05b','stop-opacity':'.015'}));
  defs.append(grad); svg.append(defs);

  for (let i=0;i<5;i++) {
    const value = max - (max-min)*i/4;
    const yy = y(value);
    svg.append(svgEl('line',{x1:left,y1:yy,x2:right,y2:yy,stroke:'#e7e8f0','stroke-width':1}));
    svg.append(svgEl('text',{x:42,y:yy+4,'text-anchor':'end',fill:'#7b7990','font-size':'11','font-weight':'600'},value.toFixed(3)));
  }
  let line = '';
  data.forEach((d,i) => {line += `${i?'L':'M'}${x(i).toFixed(2)} ${y(d.venta).toFixed(2)} `;});
  const area = `${line}L${x(data.length-1)} ${bottom} L${x(0)} ${bottom} Z`;
  svg.append(svgEl('path',{d:area,fill:'url(#pdh-trend-fill)'}));
  svg.append(svgEl('path',{d:line,fill:'none',stroke:'#0c9b53','stroke-width':3.1,'stroke-linecap':'round','stroke-linejoin':'round'}));
  const labelStep = Math.max(1, Math.ceil(data.length / 6));
  data.forEach((d,i) => {
    svg.append(svgEl('circle',{cx:x(i),cy:y(d.venta),r:i===data.length-1?5:3.3,fill:'#0c9b53',stroke:'#fff','stroke-width':i===data.length-1?2.5:1}));
    const label=d.date.toLocaleDateString('es-PE',{day:'numeric',month:'short',timeZone:'America/Lima'}).replace('.','');
    if (i % labelStep === 0 || i === data.length - 1) {
      svg.append(svgEl('text',{x:x(i),y:218,'text-anchor':'middle',fill:'#737187','font-size':'10','font-weight':'600'},label));
    }
  });
  // Last official data point (not a guessed live market value).
  const last = data[data.length-1];
  const px = x(data.length-1), py = y(last.venta);
  svg.append(svgEl('rect',{x:Math.min(410,px-66),y:Math.max(3,py-30),width:64,height:23,rx:8,fill:'#e3f9e9',stroke:'#c5eccf'}));
  svg.append(svgEl('text',{x:Math.min(410,px-66)+32,y:Math.max(3,py-30)+16,'text-anchor':'middle',fill:'#087b44','font-size':'12','font-weight':'800'},`S/ ${last.venta.toFixed(3)}`));
  svg.setAttribute('aria-label',`Evolución de venta SUNAT de ${data.length} registros diarios, desde ${data[0].venta.toFixed(3)} hasta ${last.venta.toFixed(3)} soles por dólar`);
  // En SVG, `hidden = false` puede NO retirar el atributo `hidden` del DOM.
  // Retirarlo explícitamente evita que la regla CSS `[hidden]` oculte el gráfico.
  svg.removeAttribute('hidden');
  placeholder.hidden = true;
  if (foot) foot.textContent = `${data.length} registros diarios disponibles. Último dato: ${last.date.toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric',timeZone:'America/Lima'})}. Referencia SUNAT, no tasa comercial.`;
}

function displayTrendPeriod(period) {
  currentPeriod = period === 'today' ? 'today' : 'month';
  document.querySelectorAll('[data-trend-period]').forEach(button => {
    const active = button.dataset.trendPeriod === currentPeriod;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const title = document.getElementById('trend-chart-title');
  const svg = document.getElementById('trend-svg');
  const placeholder = document.getElementById('trend-placeholder');
  const foot = document.getElementById('trend-foot');
  if (currentPeriod === 'today') {
    if (title) title.textContent = 'Cotizaciones de hoy · USD/PEN';
    if (svg) svg.setAttribute('hidden','');
    if (placeholder) {
      placeholder.hidden = false;
      placeholder.textContent = 'Aún no contamos con un historial por horas. Las mejores tasas actuales están arriba; no mostramos una curva intradía sin datos verificables.';
    }
    if (foot) foot.textContent = 'La referencia SUNAT es diaria. El gráfico de hoy estará disponible cuando exista una fuente intradía con historial autorizado.';
    return;
  }
  if (title) title.textContent = 'Histórico de venta SUNAT · hasta 30 días';
  if (!hasLoadedHistory) {
    if (svg) svg.setAttribute('hidden','');
    if (placeholder) { placeholder.hidden = false; placeholder.textContent = 'Cargando historial oficial…'; }
    return;
  }
  renderTrend(monthlyHistory);
}

export async function loadHomeTrend() {
  document.querySelectorAll('[data-trend-period]').forEach(button => {
    button.addEventListener('click', () => displayTrendPeriod(button.dataset.trendPeriod));
  });
  displayTrendPeriod('month');
  try {
    monthlyHistory = await cargarSunatHistorialMes();
    hasLoadedHistory = true;
    setState({sunat30: monthlyHistory, sunat7: monthlyHistory.slice(-7)});
  } catch(error) {
    console.warn('El gráfico histórico no está disponible:',error);
    monthlyHistory = [];
    hasLoadedHistory = true;
  }
  displayTrendPeriod(currentPeriod);
}
