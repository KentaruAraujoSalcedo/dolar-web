// ============================================================
// Shared: obtener dataset limpio + ordenado (tabla y modal)
// ============================================================

/**
 * Devuelve array limpio:
 * - solo source="scraper"
 * - sin SUNAT
 * - compra/venta numéricas (Number)
 * - filtra solo finitas
 *
 * fallbackToTasas:
 *  - true  => si state.validas está vacío, usa state.tasas
 *  - false => usa solo state.validas
 */
export function getCasasValidasLimpias({ fallbackToTasas = false } = {}) {
  const base =
    Array.isArray(state?.validas) && state.validas.length
      ? state.validas
      : (fallbackToTasas && Array.isArray(state?.tasas) ? state.tasas : []);

  return base
    .filter(c => (c?.source || "").toLowerCase() === "scraper")
    .filter(c => String(c?.casa || "").toUpperCase() !== "SUNAT" && String(c?.slug || "").toLowerCase() !== "sunat")
    .map(c => ({
      ...c,
      compra: Number(c?.compra),
      venta: Number(c?.venta),
    }))
    .filter(c => Number.isFinite(c.compra) && Number.isFinite(c.venta));
}

/**
 * Ordena casas por:
 * - "auto"  : igual que tu tabla (depende del conversor: state.modo + have/want)
 * - "compra": compra desc (mejor compra primero)
 * - "venta" : venta asc (mejor venta primero)
 */
export function sortCasas(casas, sortBy = "auto") {
  const arr = Array.isArray(casas) ? [...casas] : [];

  if (sortBy === "compra") {
    arr.sort((a, b) => b.compra - a.compra);
    return arr;
  }

  if (sortBy === "venta") {
    arr.sort((a, b) => a.venta - b.venta);
    return arr;
  }

  // sortBy === "auto" (misma lógica que ordenarValidasSegunModo)
  const { modo } = state;
  const { have, want } = getHaveWant();

  if (modo === "recibir") {
    if (have === "USD" && want === "PEN") arr.sort((a, b) => b.compra - a.compra);
    else if (have === "PEN" && want === "USD") arr.sort((a, b) => a.venta - b.venta);
  } else {
    // necesito
    if (want === "USD" && have === "PEN") arr.sort((a, b) => a.venta - b.venta);
    else if (want === "PEN" && have === "USD") arr.sort((a, b) => b.compra - a.compra);
  }

  return arr;
}