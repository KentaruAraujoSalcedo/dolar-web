// ==============================
// File: scripts/data.js
// ==============================
import { state, setState } from './state.js';
export async function cargarTasas() {
  const res = await fetch(`${API_BASE}/resumen`, {
    headers: { "x-api-key": API_KEY },
  });

const API_BASE = "https://dolar-api.jaime-araujo-martech.workers.dev";
const API_KEY  = "K3d9F2kLm8QpX7ZcA91WnY0R5uS"; // la misma que pusiste en env.API_KEY del Worker
  if (!res.ok) throw new Error(`API resumen ${res.status}`);

/* ============================================================
   Helpers de normalización (para logos / matching / filtros)
   ============================================================ */
  const data = await res.json();

// Convierte "ZonaDólar", "Zona Dolar", "zona-dólar" => "zonadolar"
function slugCasa(nombre = '') {
  return String(nombre)
    .trim()
    .toLowerCase()
    .normalize('NFD')                 // separa acentos
    .replace(/[\u0300-\u036f]/g, '')  // elimina acentos
    .replace(/[^a-z0-9]+/g, '')       // deja solo alfanumérico
}
  // armamos una lista pequeña desde el resumen (sin duplicados)
  const map = new Map();

// Lista “baseline” de casas verificadas (ajústala a tu gusto)
const VERIFIED_SLUGS = new Set([
  'sunat',
  'zonadolar',
  'inkamoney',
  'chaskidolar',
  // agrega las que tú consideres verificadas
]);
  const push = (x) => {
    if (!x || !x.casa) return;
    map.set(slugCasa(x.casa), x);
  };

// Carga tasas y separa válidas/ inválidas. No toca el DOM aquí.
export async function cargarTasas() {
  const res = await fetch(`${API_BASE}/resumen`, {
    headers: { "x-api-key": API_KEY },
  });

  if (!res.ok) throw new Error(`API resumen ${res.status}`);

  const data = await res.json();

  // armamos una lista pequeña desde el resumen (sin duplicados)
  const map = new Map();

  const push = (x) => {
    if (!x || !x.casa) return;
    map.set(slugCasa(x.casa), x);
  };

  push(data.mejorCompra);
  push(data.mejorVenta);
  (data.topCompra || []).forEach(push);
  (data.topVenta || []).forEach(push);

  const todasRaw = [...map.values()];

  const todas = todasRaw.map(c => {
    const slug = slugCasa(c.casa);
    return {
      ...c,
      slug,
      verificada: VERIFIED_SLUGS.has(slug)
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


export async function cargarSunatDesdeTasas() {
  // Busca SUNAT dentro del mismo JSON de tasas
  if (!state.tasas.length) await cargarTasas();

  // Soporta variaciones del nombre (SUNAT, Sunat, etc.)
  const sunat = state.tasas.find(t => slugCasa(t.casa) === 'sunat');

  if (sunat && Number.isFinite(sunat.compra) && Number.isFinite(sunat.venta)) {
    setState({ sunat: { compra: sunat.compra, venta: sunat.venta } });
  } else {
    setState({ sunat: { compra: null, venta: null } });
  }
}

export async function cargarHistorico() {
  const res = await fetch('data/historico.json');
  const data = await res.json();

  // Orden por fecha asc y últimos 7
  return data
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(-7);
}

// ==============================
// META (cuándo corrieron los scrapers)
// ==============================
export async function cargarMeta() {
  try {
    const res = await fetch('data/meta.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`meta.json ${res.status}`);
    const meta = await res.json();

    // lo guardamos en state por si lo quieres usar luego (badge, debug, etc.)
    setState({ meta });

    return meta;
  } catch (e) {
    console.warn('Meta no disponible:', e);
    setState({ meta: null });
    return null;
  }
}
