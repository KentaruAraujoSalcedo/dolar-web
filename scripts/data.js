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
