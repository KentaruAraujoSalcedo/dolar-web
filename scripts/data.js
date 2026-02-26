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

  // resumen -> armar lista pequeña (como ya hacías)
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

  const map = new Map();
  const push = (x) => {
    if (!x || !x.casa) return;
    map.set(slugCasa(x.casa), x);
  };

  push(resumen.mejorCompra);
  push(resumen.mejorVenta);
  (resumen.topCompra || []).forEach(push);
  (resumen.topVenta || []).forEach(push);

  const todasRaw = [...map.values()];

  const todas = todasRaw.map(c => {
    const slug = slugCasa(c.casa);
    return {
      ...c,
      slug,
    };
  });

  const validas = todas.filter(c => Number.isFinite(c.compra) && Number.isFinite(c.venta));
  const invalidas = todas.filter(c => !Number.isFinite(c.compra) || !Number.isFinite(c.venta));

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
   SUNAT: últimos 7 días (para el gráfico)
   - sigue usando /sunat-mensual
   - IMPORTANTÍSIMO: sin x-api-key y sin cache:"no-store"
   ============================================================ */

// Devuelve SIEMPRE un array de días [{fecha, compra, venta}, ...] (máx 7)
export async function cargarSunatUltimos7Dias() {
  const res = await fetch(`${API_BASE}/sunat-mensual`);
  if (!res.ok) return [];

  const payload = await res.json();
  const dias = Array.isArray(payload?.dias) ? payload.dias : [];

  return dias
    .filter(d => d && d.fecha && Number.isFinite(d.compra) && Number.isFinite(d.venta))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(-7);
}
