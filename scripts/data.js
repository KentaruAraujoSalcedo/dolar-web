// ==============================
// File: scripts/data.js
// ==============================
import { state, setState } from './state.js';
import { CONFIG } from './config.js';

const API_BASE = CONFIG.API_BASE;

/* ============================================================
   Helpers de normalización (para logos / matching / filtros)
   ============================================================ */

// Convierte "ZonaDólar", "Zona Dolar", "zona-dólar" => "zonadolar"
function slugCasa(nombre = '') {
  return String(nombre)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

/* ============================================================
   NUEVO: carga todo en 1 sola llamada
   - usa /api/data (cacheado en edge)
   - NO usa x-api-key (evita preflight)
   ============================================================ */
export async function cargarData() {
  const res = await fetch(`${API_BASE}/api/data`);

  if (!res.ok) throw new Error(`API /api/data ${res.status}`);

  const payload = await res.json();

  // meta
  setState({ meta: payload.meta || null });

  // sunat (último día)
  if (payload.sunat && Number.isFinite(payload.sunat.compra) && Number.isFinite(payload.sunat.venta)) {
    setState({
      sunat: {
        compra: payload.sunat.compra,
        venta: payload.sunat.venta,
        fecha: payload.sunat.fecha,
        source: payload.sunat.source || "sunat_mensual",
      },
    });
  } else {
    setState({ sunat: { compra: null, venta: null, fecha: null, source: null } });
  }

  // /api/data entrega el listado completo en resumen.todas desde la nueva API.
  // Compatibilidad: si la API antigua aún no incluye `todas`, reconstruimos
  // el conjunto a partir de los tops, sin romper el comparador.
  const resumen = payload.resumen;

  if (!resumen) {
    setState({
      tasas: [],
      validas: [],
      invalidas: [],
      mejorCompra: null,
      mejorVenta: null,
      winnerCompra: null,
      winnerVenta: null,
    });
    return;
  }

  const todasDisponibles = Array.isArray(resumen.todas);
  const origen = todasDisponibles
    ? resumen.todas
    : [resumen.mejorCompra, resumen.mejorVenta,
        ...(Array.isArray(resumen.topCompra) ? resumen.topCompra : []),
        ...(Array.isArray(resumen.topVenta) ? resumen.topVenta : [])];

  // Datos listos para pantalla: solo casas comerciales con ambas tasas válidas.
  // `regular` es una cotización válida (spread alto), no un scraper fallido.
  const mapa = new Map();
  for (const casa of origen) {
    if (!casa || !casa.casa) continue;
    const slug = slugCasa(casa.casa);
    const source = String(casa.source ?? '').trim().toLowerCase();
    const compra = Number(casa.compra);
    const venta = Number(casa.venta);
    if (!slug || slug === 'sunat') continue;
    if (source !== 'scraper' && source !== 'regular') continue;
    if (!Number.isFinite(compra) || !Number.isFinite(venta) || compra <= 0 || venta <= 0) continue;
    if (venta < compra) continue; // Nunca mostrar una cotización invertida.
    if (!mapa.has(slug)) mapa.set(slug, { ...casa, slug, compra, venta, source });
  }

  const validas = [...mapa.values()];
  const todas = validas; // mismas filas para el ranking y la calculadora
  const invalidas = []; // datos descartados no se publican en la interfaz

  const mejorCompra = validas.length ? Math.max(...validas.map(c => c.compra)) : null;
  const mejorVenta  = validas.length ? Math.min(...validas.map(c => c.venta))  : null;

  const winnerCompra = (mejorCompra != null)
    ? validas.find(c => c.compra === mejorCompra)?.casa ?? null
    : null;

  const winnerVenta = (mejorVenta != null)
    ? validas.find(c => c.venta === mejorVenta)?.casa ?? null
    : null;

  setState({
    tasas: todas,
    validas,
    invalidas,
    mejorCompra,
    mejorVenta,
    winnerCompra,
    winnerVenta
  });
}

/* ============================================================
   SUNAT: historial oficial disponible en /sunat-mensual.
   Importante: esta API ofrece datos diarios, NO una serie intradía.
   ============================================================ */
function fechaSunatISO(raw) {
  const value = String(raw ?? '').trim();
  let year, month, day;
  let match = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:$|[T\s])/);
  if (match) {
    [,year,month,day] = match;
  } else {
    match = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (!match) return null;
    [,day,month,year] = match;
  }
  const y = Number(year), m = Number(month), d = Number(day);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

export async function cargarSunatHistorialMes() {
  const res = await fetch(`${API_BASE}/sunat-mensual`);
  if (!res.ok) return [];
  const payload = await res.json();
  const dias = Array.isArray(payload?.dias) ? payload.dias : [];
  return dias
    .filter(d => d && fechaSunatISO(d.fecha) && Number.isFinite(Number(d.compra)) && Number.isFinite(Number(d.venta)) && Number(d.compra) > 0 && Number(d.venta) > 0)
    .map(d => ({ fecha: fechaSunatISO(d.fecha), compra: Number(d.compra), venta: Number(d.venta) }))
    .sort((a,b) => a.fecha.localeCompare(b.fecha))
    .slice(-30);
}

// Compatibilidad con el gráfico modal histórico (últimos 7 registros).
export async function cargarSunatUltimos7Dias() {
  return (await cargarSunatHistorialMes()).slice(-7);
}
