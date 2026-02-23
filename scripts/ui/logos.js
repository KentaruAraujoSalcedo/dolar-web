// ==============================
// File: scripts/ui/logos.js
// Catálogo único (fuente de verdad)
// - Sin aliases
// - Todo clickeable (url)
// - Logo estable (logo)
// ==============================

function norm(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * ✅ Catálogo ÚNICO
 * Reglas:
 * - "casa" debe ser EXACTAMENTE el nombre canónico que usarás en todo el proyecto
 * - "url" debe existir siempre
 * - "logo" debe existir siempre
 */
const CASAS_CATALOG = [
  { casa: "acomo", url: "https://acomo.com.pe/", logo: "/IMG/casas/acomo.webp" },
  { casa: "billex", url: "https://www.billex.pe/", logo: "/IMG/casas/billex.webp" },
  { casa: "cambiafx", url: "https://cambiafx.pe/", logo: "/IMG/casas/cambiafx.webp" },
  { casa: "cambiodigitalperu", url: "https://cambiodigitalperu.com", logo: "/IMG/casas/cambiodigitalperu.webp" },
  { casa: "cambiosmass", url: "https://cambiosmass.com/", logo: "/IMG/casas/cambiosmass.webp" },
  { casa: "cambiomundial", url: "https://www.cambiomundial.com/", logo: "/IMG/casas/cambiomundial.webp" },
  { casa: "cambioseguro", url: "https://cambioseguro.com/", logo: "/IMG/casas/cambioseguro.webp" },
  { casa: "cambioselgordito", url: "https://cambioselgordito.com/", logo: "/IMG/casas/cambioselgordito.webp" },
  { casa: "cambiosol", url: "https://cambiosol.pe/", logo: "/IMG/casas/cambiosol.webp" },
  { casa: "cambiox", url: "https://cambiox.pe/", logo: "/IMG/casas/cambiox.webp" },
  { casa: "cambix", url: "https://cambix.com.pe/", logo: "/IMG/casas/cambix.webp" },
  { casa: "chapacambio", url: "https://chapacambio.com/", logo: "/IMG/casas/chapacambio.webp" },
  { casa: "chaskidolar", url: "https://chaskidolar.com/", logo: "/IMG/casas/chaskidolar.webp" },
  { casa: "defiperu", url: "https://defiperu.com/change/FIAT", logo: "/IMG/casas/defiperu.webp" },
  { casa: "dichikash", url: "https://dichikash.com/", logo: "/IMG/casas/dichikash.webp" },
  { casa: "dinekash", url: "https://dinekash.pe/", logo: "/IMG/casas/dinekash.webp" },
  { casa: "dinersfx", url: "https://dinersfx.pe/", logo: "/IMG/casas/dinersfx.webp" },
  { casa: "dlsmoney", url: "https://dlsmoney.pe/", logo: "/IMG/casas/dlsmoney.webp" }, // si no existe, quítala o corrige
  { casa: "dolarex", url: "https://dolarex.pe/", logo: "/IMG/casas/dolarex.webp" },
  { casa: "dollarhouse", url: "https://app.dollarhouse.pe/", logo: "/IMG/casas/dollarhouse.webp" },
  { casa: "global66", url: "https://www.global66.com/pe/envios-de-dinero/", logo: "/IMG/casas/global66.webp" },
  { casa: "hirpower", url: "https://www.hirpower.com/", logo: "/IMG/casas/hirpower.webp" },
  { casa: "inkamoney", url: "https://inkamoney.com/", logo: "/IMG/casas/inkamoney.webp" },
  { casa: "instakash", url: "https://instakash.pe/", logo: "/IMG/casas/instakash.webp" }, // si no existe, corrige
  { casa: "intercambialo", url: "https://intercambialo.pe/", logo: "/IMG/casas/intercambialo.webp" },
  { casa: "inticambio", url: "https://inticambio.pe/", logo: "/IMG/casas/inticambio.webp" },
  { casa: "jetperu", url: "https://jetperu.com.pe/cambiar-dinero/", logo: "/IMG/casas/jetperu.webp" },
  { casa: "kallpacambios", url: "https://kallpacambios.com/", logo: "/IMG/casas/kallpacambios.webp" },
  { casa: "kambio", url: "https://www.kambio.online/", logo: "/IMG/casas/kambioonline.webp" },
  { casa: "kambista", url: "https://kambista.com/", logo: "/IMG/casas/kambista.webp" },
  { casa: "marketdollar", url: "https://market-dollar.com/", logo: "/IMG/casas/marketdollar.webp" },
  { casa: "megamoney", url: "https://megamoney.pe/", logo: "/IMG/casas/megamoney.webp" },
  { casa: "mercadocambiario", url: "https://www.mercadocambiario.pe/", logo: "/IMG/casas/mercadocambiario.webp" },
  { casa: "midpointfx", url: "https://www.midpointfx.com/", logo: "/IMG/casas/midpointfx.webp" },
  { casa: "misterdollar", url: "https://misterdollar.pe/", logo: "/IMG/casas/misterdollar.webp" },
  { casa: "moneyhouse", url: "https://moneyhouse.pe/", logo: "/IMG/casas/moneyhouse.webp" },
  { casa: "moneyplus", url: "https://www.moneyplus.pe/", logo: "/IMG/casas/moneyplus.webp" },
  { casa: "okane", url: "https://okanecambiodigital.com/", logo: "/IMG/casas/okane.webp" },
  { casa: "perudolar", url: "https://perudolar.pe/", logo: "/IMG/casas/perudolar.webp" },
  { casa: "rextie", url: "https://www.rextie.com/", logo: "/IMG/casas/rextie.webp" },
  { casa: "rissanpe", url: "https://www.rissanpe.com/", logo: "/IMG/casas/rissanpe.webp" },
  { casa: "roblex", url: "https://roblex.pe/", logo: "/IMG/casas/roblex.webp" },
  { casa: "safex", url: "https://www.safex.pe/", logo: "/IMG/casas/safex.webp" },
  { casa: "securex", url: "https://securex.pe/", logo: "/IMG/casas/securex.webp" },
  { casa: "smartdollar", url: "https://www.smartdollar.pe/", logo: "/IMG/casas/smartdollar.webp" },
  { casa: "srcambio", url: "https://srcambio.pe/", logo: "/IMG/casas/srcambio.webp" },
  { casa: "tkambio", url: "https://tkambio.com/", logo: "/IMG/casas/tkambio.webp" },
  { casa: "tucambista", url: "https://tucambista.pe/", logo: "/IMG/casas/tucambista.webp" },
  { casa: "vipcapital", url: "https://www.vipcapitalbusiness.com/", logo: "/IMG/casas/vipcapital.webp" },
  { casa: "westernunion", url: "https://www.westernunionperu.pe/cambiodemoneda", logo: "/IMG/casas/westernunion.webp" },
  { casa: "xcambio", url: "https://x-cambio.com/", logo: "/IMG/casas/xcambio.webp" },
  { casa: "yanki", url: "https://yanki.pe", logo: "/IMG/casas/yanki.webp" },
  { casa: "zonadolar", url: "https://zonadolar.pe/", logo: "/IMG/casas/zonadolar.webp" },

  // SUNAT (si quieres que salga en catálogo, si no, quítala)
  { casa: "SUNAT", url: "https://www.sunat.gob.pe/", logo: "/IMG/casas/sunat.webp" },
];

// Índices rápidos por key normalizado
const CAT_BY_KEY = Object.fromEntries(CASAS_CATALOG.map(x => [norm(x.casa), x]));

export function getCasaLogoSrc(nombreCasa) {
  if (!nombreCasa) return null;
  return CAT_BY_KEY[norm(nombreCasa)]?.logo || null;
}

export function getCasaUrl(nombreCasa) {
  if (!nombreCasa) return null;
  return CAT_BY_KEY[norm(nombreCasa)]?.url || null;
}

export function getCasasCatalog() {
  // Devuelve ordenado alfabéticamente por “casa”
  return [...CASAS_CATALOG].sort((a, b) => a.casa.localeCompare(b.casa, 'es'));
}

// Debug: casas que te aparecen en data pero NO existen en catálogo
export function getMissingFromCatalog(nombres = []) {
  return (nombres || [])
    .filter(Boolean)
    .map(x => String(x))
    .filter(x => !CAT_BY_KEY[norm(x)]);
}