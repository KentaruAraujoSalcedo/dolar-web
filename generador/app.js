const SOURCE_CAMPAIGN = "campaign";
const WEB_LOGIN_BASE = "https://mi.scotiabank.com.pe/login?redirectTo=";
const APP_WEBVIEW_BASE = "scotiabankpe:///webView?path=";
const APP_SCHEME_BASE = "scotiabankpe:///";

let PRODUCTOS = [];
let WEBVIEW_CATALOG = {};
let NATIVE_CATALOG = {};
let POR_REVISAR_WEBVIEW = [];

let CAMPAIGN_SOURCES = {};
let SOURCE_NAMES = {};
let MEDIUM_NAMES = {};

let productoSeleccionado = null;
let AUTO_GENERATED_LINKS = [];
let PRESET_OPENMARKET_ACTIVO = false;
let RESULTADO_ACTUAL = null;

// Presets tomados de los valores existentes en campanas.json.
// Son SUGERENCIAS editables, no una nueva política corporativa de nomenclatura.
const GUIA_CANALES = {
  meta: {source:"meta", medium:"paid-social", utm:true, ejemplo:"Meta-Producto-Producto-Periodo", content:"video_01", consejo:"Meta: el catálogo del banco usa meta / paid-social. Identifica cada anuncio con utm_content. Respeta la convención vigente de tu equipo."},
  google: {source:"google", medium:"paid-cpc", utm:true, ejemplo:"Google-Search-Producto-Periodo", content:"anuncio_01", consejo:"Google Ads: el catálogo usa google / paid-cpc. Revisa el autoetiquetado y no dupliques ni reemplaces un esquema de atribución ya aprobado."},
  email: {source:"masterbase", medium:"email", utm:true, ejemplo:"Email-Producto-Producto-Periodo", content:"boton_principal", consejo:"Email: identifica envío y botón. La fuente sugerida es masterbase porque así figura en tu campanas.json; si se envía desde Epsilon, cambia a epsilon."},
  whatsapp: {source:"whatsapp", medium:"link", utm:true, ejemplo:"WhatsApp-Producto-Periodo", content:"mensaje_01", consejo:"WhatsApp: usa el origen y medio de tu catálogo. Verifica si el envío será orgánico, CRM o pauta antes de etiquetar."},
  sms: {source:"sms", medium:"sms", utm:true, ejemplo:"SMS-Producto-Periodo", content:"cta_01", consejo:"SMS: usa sms / sms según campanas.json y diferencia el envío con utm_campaign."},
  tiktok: {source:"tiktok", medium:"paid-social", utm:true, ejemplo:"TikTok-Producto-Periodo", content:"video_01", consejo:"TikTok Ads: utiliza los valores de tu catálogo y distingue creatividades con utm_content."},
  push: {source:"firebase", medium:"push", utm:true, ejemplo:"Push-Producto-Periodo", content:"notificacion_01", consejo:"Push: el catálogo contempla firebase / push. Confirma el tratamiento de atribución de la App."},
  qr: {source:"folleto-fisico", medium:"qr", utm:true, ejemplo:"QR-Producto-Periodo", content:"afiche_01", consejo:"QR: el catálogo usa folleto-fisico / qr. El destino debe ser una URL HTTPS adecuada para cámara del celular; evita deeplinks directos sin fallback."},
  internal: {utm:false, consejo:"Dentro de la web del banco: evita UTM. Puedes enviar source y detail como parámetros adicionales si el destino lo admite."},
  other: {utm:true, consejo:"Elige utm_source, utm_medium y utm_campaign manualmente usando las convenciones actuales del equipo de Analytics."}
};


/* =========================================================
   UTILIDADES
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function limpiarValor(valor) {
  return String(valor ?? "").trim();
}

function normalizarTaxonomia(valor) {
  return limpiarValor(valor).toLowerCase();
}

function normalizarRuta(ruta) {
  const limpia = limpiarValor(ruta);

  if (!limpia) {
    return "";
  }

  return limpia.startsWith("/")
    ? limpia
    : "/" + limpia;
}

function esUrlWebValida(url) {
  const limpia =
    limpiarValor(url);

  return (
    limpia.startsWith("https://") ||
    limpia.startsWith("http://")
  );
}

function esDeeplinkValido(deeplink) {
  const limpia =
    limpiarValor(deeplink);

  return (
    limpia.includes("://") &&
    !limpia.includes(" ")
  );
}

function decodificarSeguro(valor) {
  const texto =
    String(valor ?? "");

  if (!texto) {
    return "";
  }

  try {
    return decodeURIComponent(
      texto.replace(/\+/g, "%20")
    );
  } catch {
    return texto;
  }
}

function extraerParametro(url, nombre) {
  const limpia =
    limpiarValor(url);

  const q =
    limpia.indexOf("?");

  if (q === -1) {
    return "";
  }

  for (
    const par
    of limpia.substring(q + 1).split("&")
  ) {
    const eq =
      par.indexOf("=");

    if (eq === -1) {
      continue;
    }

    const key =
      par.substring(0, eq);

    const value =
      par.substring(eq + 1);

    if (key === nombre) {
      return decodificarSeguro(value);
    }
  }

  return "";
}


/* =========================================================
   ESTABLECER PARÁMETROS SIN ROMPER RUTAS EXISTENTES
========================================================= */

function establecerParametros(
  urlBase,
  parametros,
  parametrosAEliminar = []
) {
  let original =
    limpiarValor(urlBase);

  let hash =
    "";

  const hashIndex =
    original.indexOf("#");

  if (hashIndex !== -1) {
    hash =
      original.substring(hashIndex);

    original =
      original.substring(
        0,
        hashIndex
      );
  }

  const queryIndex =
    original.indexOf("?");

  const base =
    queryIndex === -1
      ? original
      : original.substring(
          0,
          queryIndex
        );

  const queryOriginal =
    queryIndex === -1
      ? ""
      : original.substring(
          queryIndex + 1
        );

  const mapa =
    new Map();

  if (queryOriginal) {
    queryOriginal
      .split("&")
      .forEach(par => {
        if (!par) {
          return;
        }

        const index =
          par.indexOf("=");

        const keyRaw =
          index === -1
            ? par
            : par.substring(
                0,
                index
              );

        const valueRaw =
          index === -1
            ? ""
            : par.substring(
                index + 1
              );

        const key =
          decodificarSeguro(
            keyRaw
          );

        mapa.set(
          key,
          {
            keyOriginal:
              keyRaw,

            valueOriginal:
              valueRaw
          }
        );
      });
  }

  parametrosAEliminar
    .forEach(key => {
      mapa.delete(key);
    });

  Object.entries(
    parametros
  ).forEach(
    ([key, value]) => {
      const limpio =
        limpiarValor(value);

      if (!limpio) {
        mapa.delete(key);
        return;
      }

      mapa.set(
        key,
        {
          keyOriginal:
            key,

          valueOriginal:
            encodeURIComponent(
              limpio
            )
        }
      );
    }
  );

  const nuevaQuery =
    Array.from(
      mapa.values()
    )
      .map(item => {
        if (
          item.valueOriginal === ""
        ) {
          return item.keyOriginal;
        }

        return (
          item.keyOriginal +
          "=" +
          item.valueOriginal
        );
      })
      .join("&");

  return (
    base +
    (
      nuevaQuery
        ? "?" + nuevaQuery
        : ""
    ) +
    hash
  );
}


/* =========================================================
   PORTAPAPELES
========================================================= */

async function escribirPortapapeles(valor) {
  const texto = String(valor ?? "");
  if (!texto) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch (error) {
    // El portapapeles moderno suele requerir HTTPS o localhost.
  }
  const textarea = document.createElement("textarea");
  textarea.value = texto;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return Boolean(document.execCommand("copy"));
  } catch (error) {
    return false;
  } finally {
    textarea.remove();
  }
}


/* =========================================================
   NAVEGACIÓN ENTRE MÓDULOS
========================================================= */

function cambiarModulo(
  modulo,
  desplazar = true
) {
  const configuracion = {
    generador: {
      panel: "moduleGenerador",
      tab: "tabGenerador"
    },

    catalogo: {
      panel: "moduleCatalogo",
      tab: "tabCatalogo"
    },

    rutas: {
      panel: "moduleRutas",
      tab: "tabRutas"
    },

    analizador: {
      panel: "moduleAnalizador",
      tab: "tabAnalizador"
    },

    probador: {
      panel: "moduleProbador",
      tab: "tabProbador"
    }
  };

  const destino =
    configuracion[modulo] ||
    configuracion.generador;

  Object.values(
    configuracion
  ).forEach(item => {
    const panel =
      $(item.panel);

    const tab =
      $(item.tab);

    if (panel) {
      panel.classList.add(
        "hidden"
      );

      panel.classList.remove(
        "active"
      );
    }

    if (tab) {
      tab.classList.remove(
        "active"
      );

      tab.setAttribute(
        "aria-selected",
        "false"
      );
    }
  });

  const panelActivo =
    $(destino.panel);

  const tabActivo =
    $(destino.tab);

  if (panelActivo) {
    panelActivo
      .classList
      .remove(
        "hidden"
      );

    panelActivo
      .classList
      .add(
        "active"
      );
  }

  if (tabActivo) {
    tabActivo
      .classList
      .add(
        "active"
      );

    tabActivo.setAttribute(
      "aria-selected",
      "true"
    );
  }

  if (
    modulo === "catalogo"
  ) {
    renderCatalog();
  }

  if (
    modulo === "probador"
  ) {
    actualizarEnlaceApp();
  }

  if (desplazar) {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}


/* =========================================================
   CARGA DE CONFIGURACIÓN
========================================================= */

async function cargarConfiguracion() {
  const status =
    $("dataStatus");

  try {
    const [
      productosResponse,
      rutasResponse,
      campanasResponse
    ] =
      await Promise.all([
        fetch(
          "./productos.json",
          {
            cache: "no-store"
          }
        ),

        fetch(
          "./rutas.json",
          {
            cache: "no-store"
          }
        ),

        fetch(
          "./campanas.json",
          {
            cache: "no-store"
          }
        )
      ]);

    if (
      !productosResponse.ok
    ) {
      throw new Error(
        "productos.json HTTP " +
        productosResponse.status
      );
    }

    if (
      !rutasResponse.ok
    ) {
      throw new Error(
        "rutas.json HTTP " +
        rutasResponse.status
      );
    }

    if (
      !campanasResponse.ok
    ) {
      throw new Error(
        "campanas.json HTTP " +
        campanasResponse.status
      );
    }

    const [
      productosData,
      rutasData,
      campanasData
    ] =
      await Promise.all([
        productosResponse.json(),
        rutasResponse.json(),
        campanasResponse.json()
      ]);


    /* PRODUCTOS YA CONFIGURADOS */

    PRODUCTOS =
      Array.isArray(
        productosData.productos
      )
        ? productosData.productos
        : [];


    /* CATÁLOGO TÉCNICO */

    WEBVIEW_CATALOG =
      rutasData.webview &&
      typeof rutasData.webview === "object"
        ? rutasData.webview
        : {};

    NATIVE_CATALOG =
      rutasData.nativo &&
      typeof rutasData.nativo === "object"
        ? rutasData.nativo
        : {};

    POR_REVISAR_WEBVIEW =
      Array.isArray(
        rutasData.porRevisarWebview
      )
        ? rutasData.porRevisarWebview
        : [];


    /* CAMPAÑAS */

    CAMPAIGN_SOURCES =
      campanasData.fuentes &&
      typeof campanasData.fuentes === "object"
        ? campanasData.fuentes
        : {};

    SOURCE_NAMES =
      campanasData.nombresFuente &&
      typeof campanasData.nombresFuente === "object"
        ? campanasData.nombresFuente
        : {};

    MEDIUM_NAMES =
      campanasData.nombresMedio &&
      typeof campanasData.nombresMedio === "object"
        ? campanasData.nombresMedio
        : {};


    /* CONTROLES */

    cargarSelectProductos();

    cargarSelectCategoriasWebview();

    cargarSelectCategoriasNativo();

    cargarSelectFuentes();

    renderFuentesAutogenerador();

    renderCatalog();


    /* CONTADORES */

    const totalWebview =
      contarPathsWebview();

    const totalNativo =
      contarPantallasNativo();

    const totalCategoriasWebview =
      Object.keys(
        WEBVIEW_CATALOG
      ).length;

    const totalCategoriasNativo =
      Object.keys(
        NATIVE_CATALOG
      ).length;

    const totalFuentes =
      Object.keys(
        CAMPAIGN_SOURCES
      ).length;


    /* ESTADO */

    if (status) {
      status
        .classList
        .remove(
          "error"
        );

      status.innerHTML =
        "✓ Configuración cargada: " +
        "<strong>" +
        PRODUCTOS.length +
        " productos</strong>, " +

        "<strong>" +
        totalNativo +
        " deeplinks nativos</strong> en <strong>" +
        totalCategoriasNativo +
        " categorías</strong>, " +

        "<strong>" +
        totalWebview +
        " paths WebView</strong> en <strong>" +
        totalCategoriasWebview +
        " categorías</strong> y " +

        "<strong>" +
        totalFuentes +
        " fuentes de campaña</strong>.";
    }

  } catch (error) {
    console.error(
      "[CONFIG] Error cargando configuración:",
      error
    );

    PRODUCTOS = [];

    WEBVIEW_CATALOG = {};

    NATIVE_CATALOG = {};

    POR_REVISAR_WEBVIEW = [];

    CAMPAIGN_SOURCES = {};

    SOURCE_NAMES = {};

    MEDIUM_NAMES = {};

    cargarSelectProductos();

    cargarSelectCategoriasWebview();

    cargarSelectCategoriasNativo();

    cargarSelectFuentes();

    renderFuentesAutogenerador();

    renderCatalog();

    if (status) {
      status
        .classList
        .add(
          "error"
        );

      status.innerHTML =
        "⚠ No se pudo cargar la configuración. Verifica que " +
        "<strong>deep.html</strong>, " +
        "<strong>styles.css</strong>, " +
        "<strong>app.js</strong>, " +
        "<strong>productos.json</strong>, " +
        "<strong>rutas.json</strong> y " +
        "<strong>campanas.json</strong> " +
        "estén en la misma carpeta y que la página se abra desde un servidor Web.";
    }
  }
}


/* =========================================================
   PRODUCTOS
========================================================= */

function cargarSelectProductos() {
  const select =
    $("productSelect");

  if (!select) {
    return;
  }

  select.innerHTML =
    '<option value="">Nuevo destino / seleccionar producto...</option>';

  PRODUCTOS.forEach(
    producto => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        producto.id;

      option.textContent =
        producto.nombre;

      select.appendChild(
        option
      );
    }
  );
}


/* =========================================================
   RESOLUCIÓN DE PRODUCTOS
========================================================= */

function detectarTipoProducto(producto) {
  if (
    producto.tipo === "webview"
  ) {
    return "webview";
  }

  if (
    producto.tipo === "nativo" ||
    producto.tipo === "native"
  ) {
    return "native";
  }

  const app =
    limpiarValor(
      producto.app
    );

  return app.startsWith(
    APP_WEBVIEW_BASE
  )
    ? "webview"
    : "native";
}

function extraerPathWebViewApp(
  appUrl
) {
  const app =
    limpiarValor(appUrl);

  if (
    !app.startsWith(
      APP_WEBVIEW_BASE
    )
  ) {
    return "";
  }

  const resto =
    app.substring(
      APP_WEBVIEW_BASE.length
    );

  const amp =
    resto.indexOf("&");

  return amp === -1
    ? resto
    : resto.substring(
        0,
        amp
      );
}

function normalizarDestinoAppNativo(
  valor
) {
  const limpia =
    limpiarValor(valor);

  if (!limpia) {
    return "";
  }

  if (
    limpia.startsWith(
      "scotiabankpe://"
    )
  ) {
    return limpia;
  }

  return (
    APP_SCHEME_BASE +
    limpia.replace(
      /^\/+/,
      ""
    )
  );
}

function extraerBaseDeeplinkNativo(
  appUrl
) {
  const app =
    limpiarValor(appUrl);

  if (
    !app.startsWith(
      APP_SCHEME_BASE
    )
  ) {
    return app;
  }

  const sinScheme =
    app.substring(
      APP_SCHEME_BASE.length
    );

  const q =
    sinScheme.indexOf("?");

  return q === -1
    ? sinScheme
    : sinScheme.substring(
        0,
        q
      );
}

function resolverProducto(producto) {
  const tipo =
    detectarTipoProducto(
      producto
    );

  if (
    tipo === "webview"
  ) {
    const rutaWeb =
      producto.rutaWeb ||
      producto.ruta ||
      extraerParametro(
        producto.web || "",
        "redirectTo"
      ) ||
      extraerParametro(
        producto.web || "",
        "redirecto"
      );

    const rutaApp =
      producto.rutaApp ||
      producto.ruta ||
      extraerPathWebViewApp(
        producto.app || ""
      );

    return {
      ...producto,

      tipo:
        "webview",

      rutaWeb:
        rutaWeb || "",

      rutaApp:
        rutaApp || "",

      web:
        producto.web ||
        (
          rutaWeb
            ? WEB_LOGIN_BASE +
              normalizarRuta(
                rutaWeb
              )
            : ""
        ),

      app:
        producto.app ||
        (
          rutaApp
            ? APP_WEBVIEW_BASE +
              normalizarRuta(
                rutaApp
              )
            : ""
        )
    };
  }

  const webFallback =
    producto.webFallback ||
    producto.web ||
    "";

  const appPath =
    producto.appPath ||
    producto.app ||
    "";

  return {
    ...producto,

    tipo:
      "native",

    web:
      webFallback,

    app:
      normalizarDestinoAppNativo(
        appPath
      )
  };
}


/* =========================================================
   SELECCIÓN DE PRODUCTO
========================================================= */

function seleccionarProducto(id) {
  // Evita heredar source y detail del preset al seleccionar otro producto.
  if (PRESET_OPENMARKET_ACTIVO) {
    if ($("detail")) $("detail").value = "";
  
    PRESET_OPENMARKET_ACTIVO = false;
  }
  const productoBase =
    PRODUCTOS.find(
      producto =>
        producto.id === id
    );

  productoSeleccionado =
    productoBase ||
    null;

  if (!productoBase) {
    if ($("webUrl")) {
      $("webUrl").value =
        "";
    }

    if ($("appUrl")) {
      $("appUrl").value =
        "";
    }

    limpiarCamposConstructor(
      true
    );

    limpiarProbador();

    ocultarResultado();

    resetAutogenerador();

    renderCatalog();

    return;
  }

  const producto =
    resolverProducto(
      productoBase
    );

  $("webUrl").value =
    producto.web;

  $("appUrl").value =
    producto.app;

  cargarConstructorDesdeProducto(
    productoBase
  );

  cargarProbadorRutas(
    producto.web,
    producto.app,
    producto.nombre
  );

  ocultarResultado();

  AUTO_GENERATED_LINKS =
    [];

  const autoCard =
    $("autoResultsCard");

  if (autoCard) {
    autoCard
      .classList
      .add(
        "hidden"
      );
  }

  renderCatalog();
}

function seleccionarDesdeCatalogo(id) {
  seleccionarProducto(id);
  cambiarModulo("generador");
  // Si aún no eligió canal, empieza por el Paso 1.
  irAlPaso(limpiarValor($("guidedChannel")?.value) ? 2 : 1, true);
}

function obtenerEnlacesCatalogo(producto) {
  const web = esUrlWebValida(producto.web) ? producto.web : "";
  const app = esDeeplinkValido(producto.app) ? producto.app : "";
  // Enlace base de consulta: sin UTM ni source/detail nuevos.
  const base = web ? construirVariantesEnlace({
    webBase: web, appBase: app, modoDestino: app ? "combinado" : "web",
    modoMedicion: "interno", sourceCampanaInterno: false,
    sourceExtra: "", detail: ""
  }).finalUrl : "";
  return {web, app, base};
}

async function copiarRutaCatalogo(id, campo) {
  const productoBase = PRODUCTOS.find(x => x.id === id);
  if (!productoBase) return;
  const urls = obtenerEnlacesCatalogo(resolverProducto(productoBase));
  const valor = urls[campo];
  if (!valor) return;
  const ok = await escribirPortapapeles(valor);
  if (!ok) alert("No se pudo copiar automáticamente. Selecciona y copia la URL mostrada.");
}

/* =========================================================
   CATÁLOGO PRINCIPAL

/* =========================================================
   CATÁLOGO PRINCIPAL
========================================================= */

function renderCatalog() {
  const catalog = $("catalog");
  if (!catalog) return;
  const search = limpiarValor($("catalogSearch")?.value).toLowerCase();
  const filtrados = PRODUCTOS.filter(base => {
    const producto = resolverProducto(base);
    return [producto.nombre, producto.id, producto.web, producto.app, producto.tipo]
      .join(" ").toLowerCase().includes(search);
  });
  if ($("catalogVisibleCount")) $("catalogVisibleCount").textContent =
    search ? filtrados.length + " de " + PRODUCTOS.length : PRODUCTOS.length + " destinos";
  catalog.replaceChildren();
  if (!PRODUCTOS.length || !filtrados.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = !PRODUCTOS.length ? "Cargando productos.json…" : "No se encontraron destinos con ese texto.";
    catalog.appendChild(empty); return;
  }
  filtrados.forEach(base => {
    const producto = resolverProducto(base);
    const urls = obtenerEnlacesCatalogo(producto);
    const card = document.createElement("article");
    card.className = "catalog-destination-card";
    const heading = document.createElement("div"); heading.className = "catalog-destination-header";
    const title = document.createElement("strong"); title.textContent = producto.nombre;
    const type = document.createElement("span"); type.className = "catalog-type-pill";
    type.textContent = producto.tipo === "webview" ? "WebView" : "Nativo";
    heading.append(title,type); card.appendChild(heading);
    function row(label,valor,key) {
      const box = document.createElement("div"); box.className = "catalog-url-row";
      const cap = document.createElement("strong"); cap.textContent = label;
      const txt = document.createElement("code"); txt.textContent = valor || "Sin ruta configurada";
      box.append(cap,txt);
      if (valor) {
        const copy = document.createElement("button"); copy.type="button";
        copy.className="btn-secondary catalog-copy"; copy.textContent="Copiar";
        copy.addEventListener("click", () => copiarRutaCatalogo(producto.id,key)); box.appendChild(copy);
      }
      card.appendChild(box);
    }
    row("URL Web",urls.web,"web");
    row("Deeplink App",urls.app,"app");
    if (urls.base) row("Link base " + (urls.app ? "Web + App · por probar" : "Solo Web") + " (sin UTM)",urls.base,"base");
    const note = document.createElement("p"); note.className="catalog-base-note";
    note.textContent = "Las URLs son referencias del catálogo. La apertura App y el comportamiento del login deben validarse. Usa el asistente para parametrizar y publicar.";
    card.appendChild(note);
    const actions = document.createElement("div"); actions.className="actions";
    const use = document.createElement("button"); use.type="button"; use.className="btn-primary";
    use.textContent="Usar este destino en el generador →";
    use.addEventListener("click",()=>seleccionarDesdeCatalogo(producto.id));
    actions.appendChild(use); card.appendChild(actions);
    catalog.appendChild(card);
  });
}

/* =========================================================
   WEBVIEW

/* =========================================================
   WEBVIEW
========================================================= */

function contarPathsWebview() {
  let total =
    0;

  Object.values(
    WEBVIEW_CATALOG || {}
  ).forEach(grupos => {
    if (
      !Array.isArray(
        grupos
      )
    ) {
      return;
    }

    grupos.forEach(
      grupo => {
        if (
          Array.isArray(
            grupo.paths
          )
        ) {
          total +=
            grupo.paths.length;
        }
      }
    );
  });

  return total;
}

function cargarSelectCategoriasWebview() {
  const categoria =
    $("webviewCategory");

  const grupo =
    $("webviewGroup");

  const pantalla =
    $("webviewScreen");

  if (
    !categoria ||
    !grupo ||
    !pantalla
  ) {
    return;
  }

  categoria.innerHTML =
    '<option value="">Seleccionar tipo...</option>';

  Object.keys(
    WEBVIEW_CATALOG || {}
  ).forEach(
    nombre => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        nombre;

      option.textContent =
        nombre;

      categoria.appendChild(
        option
      );
    }
  );

  const manual =
    document.createElement(
      "option"
    );

  manual.value =
    "__manual__";

  manual.textContent =
    "Otro / escribir ruta manualmente";

  categoria.appendChild(
    manual
  );

  grupo.innerHTML =
    '<option value="">Seleccionar grupo...</option>';

  grupo.disabled =
    true;

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  pantalla.disabled =
    true;

  if ($("webviewManualBlock")) {
    $("webviewManualBlock")
      .classList
      .add(
        "hidden"
      );
  }

  if (
    $("webviewSelectedPathBox")
  ) {
    $("webviewSelectedPathBox")
      .innerHTML =
        '<strong>Ruta seleccionada:</strong><br>Selecciona Tipo → Grupo → Pantalla.';
  }
}

function cargarGruposWebview() {
  const categoria =
    $("webviewCategory")
      .value;

  const grupo =
    $("webviewGroup");

  const pantalla =
    $("webviewScreen");

  const manualBlock =
    $("webviewManualBlock");

  grupo.innerHTML =
    '<option value="">Seleccionar grupo...</option>';

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  pantalla.disabled =
    true;

  if (
    categoria === "__manual__"
  ) {
    grupo.disabled =
      true;

    manualBlock
      .classList
      .remove(
        "hidden"
      );

    $("webviewPath").value =
      "";

    $("webviewSelectedPathBox")
      .innerHTML =
        '<strong>Ruta seleccionada:</strong><br>Modo manual.';

    previsualizarRutasGeneradas();

    setTimeout(
      () => {
        $("webviewPath")
          .focus();
      },
      0
    );

    return;
  }

  manualBlock
    .classList
    .add(
      "hidden"
    );

  $("webviewPath").value =
    "";

  const grupos =
    WEBVIEW_CATALOG[
      categoria
    ];

  if (
    !categoria ||
    !Array.isArray(
      grupos
    )
  ) {
    grupo.disabled =
      true;

    $("webviewSelectedPathBox")
      .innerHTML =
        '<strong>Ruta seleccionada:</strong><br>Selecciona Tipo → Grupo → Pantalla.';

    previsualizarRutasGeneradas();

    return;
  }

  grupos.forEach(
    (item, index) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        String(index);

      option.textContent =
        item.grupo +
        (
          item.cantidad
            ? " (" +
              item.cantidad +
              ")"
            : ""
        );

      grupo.appendChild(
        option
      );
    }
  );

  grupo.disabled =
    false;

  $("webviewSelectedPathBox")
    .innerHTML =
      '<strong>Ruta seleccionada:</strong><br>Selecciona un grupo.';

  previsualizarRutasGeneradas();
}

function cargarPantallasWebview() {
  const categoria =
    $("webviewCategory")
      .value;

  const grupoIndex =
    $("webviewGroup")
      .value;

  const pantalla =
    $("webviewScreen");

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  $("webviewPath").value =
    "";

  $("webviewManualBlock")
    .classList
    .add(
      "hidden"
    );

  if (
    !categoria ||
    grupoIndex === ""
  ) {
    pantalla.disabled =
      true;

    $("webviewSelectedPathBox")
      .innerHTML =
        '<strong>Ruta seleccionada:</strong><br>Selecciona un grupo.';

    previsualizarRutasGeneradas();

    return;
  }

  const grupos =
    WEBVIEW_CATALOG[
      categoria
    ] || [];

  const grupo =
    grupos[
      Number(
        grupoIndex
      )
    ];

  if (
    !grupo ||
    !Array.isArray(
      grupo.paths
    )
  ) {
    pantalla.disabled =
      true;

    previsualizarRutasGeneradas();

    return;
  }

  grupo.paths.forEach(
    path => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        path;

      option.textContent =
        path;

      pantalla.appendChild(
        option
      );
    }
  );

  const manual =
    document.createElement(
      "option"
    );

  manual.value =
    "__manual__";

  manual.textContent =
    "Otro / escribir ruta manualmente";

  pantalla.appendChild(
    manual
  );

  pantalla.disabled =
    false;

  $("webviewSelectedPathBox")
    .innerHTML =
      "<strong>" +
      grupo.grupo +
      "</strong><br>Selecciona la pantalla exacta.";

  previsualizarRutasGeneradas();
}

function seleccionarPantallaWebview() {
  const pantalla =
    $("webviewScreen")
      .value;

  const manualBlock =
    $("webviewManualBlock");

  const pathInput =
    $("webviewPath");

  if (
    pantalla === "__manual__"
  ) {
    pathInput.value =
      "";

    manualBlock
      .classList
      .remove(
        "hidden"
      );

    $("webviewSelectedPathBox")
      .innerHTML =
        '<strong>Ruta seleccionada:</strong><br>Modo manual.';

    previsualizarRutasGeneradas();

    setTimeout(
      () => {
        pathInput.focus();
      },
      0
    );

    return;
  }

  manualBlock
    .classList
    .add(
      "hidden"
    );

  pathInput.value =
    pantalla || "";

  $("webviewSelectedPathBox")
    .innerHTML =
      pantalla
        ? "<strong>Ruta seleccionada:</strong><br>" +
          pantalla
        : '<strong>Ruta seleccionada:</strong><br>Selecciona una pantalla.';

  previsualizarRutasGeneradas();
}

function actualizarRutaManualWebview() {
  const ruta =
    limpiarValor(
      $("webviewPath")
        .value
    );

  $("webviewSelectedPathBox")
    .innerHTML =
      ruta
        ? "<strong>Ruta manual:</strong><br>" +
          ruta
        : '<strong>Ruta seleccionada:</strong><br>Escribe una ruta WebView.';

  previsualizarRutasGeneradas();
}

function buscarRutaEnCatalogoWebview(
  ruta
) {
  const buscada =
    normalizarRuta(
      ruta
    );

  if (!buscada) {
    return null;
  }

  for (
    const [
      categoria,
      grupos
    ]
    of Object.entries(
      WEBVIEW_CATALOG || {}
    )
  ) {
    if (
      !Array.isArray(
        grupos
      )
    ) {
      continue;
    }

    for (
      let i = 0;
      i < grupos.length;
      i++
    ) {
      const grupo =
        grupos[i];

      if (
        Array.isArray(
          grupo.paths
        ) &&
        grupo.paths.includes(
          buscada
        )
      ) {
        return {
          categoria,
          grupoIndex:
            i,
          grupo:
            grupo.grupo,
          path:
            buscada
        };
      }
    }
  }

  return null;
}

function seleccionarRutaWebviewEnCatalogo(
  ruta
) {
  const buscada =
    normalizarRuta(
      ruta
    );

  const encontrada =
    buscarRutaEnCatalogoWebview(
      buscada
    );

  if (encontrada) {
    $("webviewCategory").value =
      encontrada.categoria;

    cargarGruposWebview();

    $("webviewGroup").value =
      String(
        encontrada.grupoIndex
      );

    cargarPantallasWebview();

    $("webviewScreen").value =
      encontrada.path;

    seleccionarPantallaWebview();

    return true;
  }

  $("webviewCategory").value =
    "__manual__";

  cargarGruposWebview();

  $("webviewPath").value =
    buscada;

  actualizarRutaManualWebview();

  return false;
}


/* =========================================================
   NATIVO
========================================================= */

function contarPantallasNativo() {
  let total =
    0;

  Object.values(
    NATIVE_CATALOG || {}
  ).forEach(grupos => {
    if (
      !Array.isArray(
        grupos
      )
    ) {
      return;
    }

    grupos.forEach(
      grupo => {
        if (
          Array.isArray(
            grupo.pantallas
          )
        ) {
          total +=
            grupo.pantallas.length;
        }
      }
    );
  });

  return total;
}

function cargarSelectCategoriasNativo() {
  const categoria =
    $("nativeCategory");

  const grupo =
    $("nativeGroup");

  const pantalla =
    $("nativeScreen");

  const manualBlock =
    $("nativeManualBlock");

  const pathInput =
    $("nativeAppDestination");

  if (
    !categoria ||
    !grupo ||
    !pantalla ||
    !manualBlock ||
    !pathInput
  ) {
    return;
  }

  categoria.innerHTML =
    '<option value="">Seleccionar tipo...</option>';

  Object.keys(
    NATIVE_CATALOG || {}
  ).forEach(
    nombre => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        nombre;

      option.textContent =
        nombre;

      categoria.appendChild(
        option
      );
    }
  );

  const manual =
    document.createElement(
      "option"
    );

  manual.value =
    "__manual__";

  manual.textContent =
    "Otro / escribir deeplink manualmente";

  categoria.appendChild(
    manual
  );

  grupo.innerHTML =
    '<option value="">Seleccionar grupo...</option>';

  grupo.disabled =
    true;

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  pantalla.disabled =
    true;

  manualBlock
    .classList
    .add(
      "hidden"
    );

  pathInput.value =
    "";

  $("nativeSelectedPathBox")
    .innerHTML =
      '<strong>Deeplink seleccionado:</strong><br>Selecciona Tipo → Grupo → Pantalla.';
}

function cargarGruposNativo() {
  const categoria =
    $("nativeCategory")
      .value;

  const grupo =
    $("nativeGroup");

  const pantalla =
    $("nativeScreen");

  const manualBlock =
    $("nativeManualBlock");

  const pathInput =
    $("nativeAppDestination");

  grupo.innerHTML =
    '<option value="">Seleccionar grupo...</option>';

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  pantalla.disabled =
    true;

  pathInput.value =
    "";

  if (
    categoria === "__manual__"
  ) {
    grupo.disabled =
      true;

    manualBlock
      .classList
      .remove(
        "hidden"
      );

    $("nativeSelectedPathBox")
      .innerHTML =
        '<strong>Deeplink seleccionado:</strong><br>Modo manual.';

    previsualizarRutasGeneradas();

    setTimeout(
      () => {
        pathInput.focus();
      },
      0
    );

    return;
  }

  manualBlock
    .classList
    .add(
      "hidden"
    );

  const grupos =
    NATIVE_CATALOG[
      categoria
    ];

  if (
    !categoria ||
    !Array.isArray(
      grupos
    )
  ) {
    grupo.disabled =
      true;

    $("nativeSelectedPathBox")
      .innerHTML =
        '<strong>Deeplink seleccionado:</strong><br>Selecciona Tipo → Grupo → Pantalla.';

    previsualizarRutasGeneradas();

    return;
  }

  grupos.forEach(
    (item, index) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        String(index);

      option.textContent =
        item.grupo +
        (
          item.cantidad
            ? " (" +
              item.cantidad +
              ")"
            : ""
        );

      grupo.appendChild(
        option
      );
    }
  );

  grupo.disabled =
    false;

  $("nativeSelectedPathBox")
    .innerHTML =
      '<strong>Deeplink seleccionado:</strong><br>Selecciona un grupo.';

  previsualizarRutasGeneradas();
}

function cargarPantallasNativo() {
  const categoria =
    $("nativeCategory")
      .value;

  const grupoIndex =
    $("nativeGroup")
      .value;

  const pantalla =
    $("nativeScreen");

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  $("nativeAppDestination").value =
    "";

  $("nativeManualBlock")
    .classList
    .add(
      "hidden"
    );

  if (
    !categoria ||
    grupoIndex === ""
  ) {
    pantalla.disabled =
      true;

    $("nativeSelectedPathBox")
      .innerHTML =
        '<strong>Deeplink seleccionado:</strong><br>Selecciona un grupo.';

    previsualizarRutasGeneradas();

    return;
  }

  const grupos =
    NATIVE_CATALOG[
      categoria
    ] || [];

  const grupo =
    grupos[
      Number(
        grupoIndex
      )
    ];

  if (
    !grupo ||
    !Array.isArray(
      grupo.pantallas
    )
  ) {
    pantalla.disabled =
      true;

    previsualizarRutasGeneradas();

    return;
  }

  grupo.pantallas.forEach(
    item => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        item.path || "";

      option.textContent =
        item.nombre
          ? item.nombre +
            " — " +
            item.path
          : item.path || "";

      pantalla.appendChild(
        option
      );
    }
  );

  const manual =
    document.createElement(
      "option"
    );

  manual.value =
    "__manual__";

  manual.textContent =
    "Otro / escribir deeplink manualmente";

  pantalla.appendChild(
    manual
  );

  pantalla.disabled =
    false;

  $("nativeSelectedPathBox")
    .innerHTML =
      "<strong>" +
      grupo.grupo +
      "</strong><br>Selecciona la pantalla exacta.";

  previsualizarRutasGeneradas();
}

function seleccionarPantallaNativo() {
  const pantalla =
    $("nativeScreen")
      .value;

  const manualBlock =
    $("nativeManualBlock");

  const pathInput =
    $("nativeAppDestination");

  if (
    pantalla === "__manual__"
  ) {
    pathInput.value =
      "";

    manualBlock
      .classList
      .remove(
        "hidden"
      );

    $("nativeSelectedPathBox")
      .innerHTML =
        '<strong>Deeplink seleccionado:</strong><br>Modo manual.';

    previsualizarRutasGeneradas();

    setTimeout(
      () => {
        pathInput.focus();
      },
      0
    );

    return;
  }

  manualBlock
    .classList
    .add(
      "hidden"
    );

  pathInput.value =
    pantalla || "";

  $("nativeSelectedPathBox")
    .innerHTML =
      pantalla
        ? "<strong>Deeplink seleccionado:</strong><br>" +
          pantalla
        : '<strong>Deeplink seleccionado:</strong><br>Selecciona una pantalla.';

  previsualizarRutasGeneradas();
}

function actualizarRutaManualNativo() {
  const ruta =
    limpiarValor(
      $("nativeAppDestination")
        .value
    );

  $("nativeSelectedPathBox")
    .innerHTML =
      ruta
        ? "<strong>Deeplink manual:</strong><br>" +
          ruta
        : '<strong>Deeplink seleccionado:</strong><br>Escribe un deeplink nativo.';

  previsualizarRutasGeneradas();
}

function buscarRutaEnCatalogoNativo(
  ruta
) {
  const buscada =
    normalizarRuta(
      ruta
    );

  if (!buscada) {
    return null;
  }

  for (
    const [
      categoria,
      grupos
    ]
    of Object.entries(
      NATIVE_CATALOG || {}
    )
  ) {
    if (
      !Array.isArray(
        grupos
      )
    ) {
      continue;
    }

    for (
      let i = 0;
      i < grupos.length;
      i++
    ) {
      const grupo =
        grupos[i];

      if (
        !Array.isArray(
          grupo.pantallas
        )
      ) {
        continue;
      }

      const pantallaIndex =
        grupo.pantallas
          .findIndex(
            item =>
              normalizarRuta(
                item.path || ""
              ) === buscada
          );

      if (
        pantallaIndex !== -1
      ) {
        return {
          categoria,

          grupoIndex:
            i,

          grupo:
            grupo.grupo,

          pantallaIndex,

          path:
            buscada
        };
      }
    }
  }

  return null;
}

function seleccionarRutaNativoEnCatalogo(
  ruta
) {
  const buscada =
    normalizarRuta(
      ruta
    );

  const encontrada =
    buscarRutaEnCatalogoNativo(
      buscada
    );

  if (encontrada) {
    $("nativeCategory").value =
      encontrada.categoria;

    cargarGruposNativo();

    $("nativeGroup").value =
      String(
        encontrada.grupoIndex
      );

    cargarPantallasNativo();

    $("nativeScreen").value =
      encontrada.path;

    seleccionarPantallaNativo();

    return true;
  }

  $("nativeCategory").value =
    "__manual__";

  cargarGruposNativo();

  $("nativeAppDestination").value =
    buscada;

  actualizarRutaManualNativo();

  return false;
}

function getModoWebNativo() {
  const seleccionado =
    document.querySelector(
      'input[name="nativeWebMode"]:checked'
    );

  return seleccionado
    ? seleccionado.value
    : "login";
}

function setModoWebNativo(modo) {
  const radio =
    document.querySelector(
      'input[name="nativeWebMode"][value="' +
      modo +
      '"]'
    );

  if (radio) {
    radio.checked =
      true;
  }

  cambiarModoWebNativo();
}

function cambiarModoWebNativo() {
  const modo =
    getModoWebNativo();

  $("nativeLoginPanel")
    .classList
    .toggle(
      "hidden",
      modo !== "login"
    );

  $("nativeLandingPanel")
    .classList
    .toggle(
      "hidden",
      modo !== "landing"
    );

  previsualizarRutasGeneradas();
}


/* =========================================================
   TIPO DE DESTINO
========================================================= */

function getTipoDestino() {
  const seleccionado =
    document.querySelector(
      'input[name="destinationType"]:checked'
    );

  return seleccionado
    ? seleccionado.value
    : "webview";
}

function setTipoDestino(tipo) {
  const radio =
    document.querySelector(
      'input[name="destinationType"][value="' +
      tipo +
      '"]'
    );

  if (radio) {
    radio.checked =
      true;
  }

  cambiarTipoDestino();
}

function cambiarTipoDestino() {
  const tipo =
    getTipoDestino();

  $("webviewPanel")
    .classList
    .toggle(
      "hidden",
      tipo !== "webview"
    );

  $("nativePanel")
    .classList
    .toggle(
      "hidden",
      tipo !== "native"
    );

  previsualizarRutasGeneradas();
}


/* =========================================================
   CONSTRUCTOR DE DESTINOS
========================================================= */

function manejarRutasDiferentes() {
  const checked =
    $("differentRoutes")
      .checked;

  $("sameRouteBlock")
    .classList
    .toggle(
      "hidden",
      checked
    );

  $("differentRoutesBlock")
    .classList
    .toggle(
      "hidden",
      !checked
    );

  if (checked) {
    const comun =
      limpiarValor(
        $("webviewPath")
          .value
      );

    if (comun) {
      if (
        !$("webviewWebPath")
          .value
      ) {
        $("webviewWebPath")
          .value =
            comun;
      }

      if (
        !$("webviewAppPath")
          .value
      ) {
        $("webviewAppPath")
          .value =
            comun;
      }
    }
  }

  previsualizarRutasGeneradas();
}

function construirWebNativaLogin(
  ruta
) {
  const limpia =
    normalizarRuta(
      ruta
    );

  return limpia
    ? WEB_LOGIN_BASE +
      limpia
    : "";
}

function construirWebNativaLanding(
  url
) {
  const limpia =
    limpiarValor(
      url
    );

  return esUrlWebValida(
    limpia
  )
    ? limpia
    : "";
}

function limpiarCamposConstructor(
  resetTipo = true
) {
  if ($("webviewPath")) {
    $("webviewPath").value =
      "";
  }

  if ($("webviewWebPath")) {
    $("webviewWebPath").value =
      "";
  }

  if ($("webviewAppPath")) {
    $("webviewAppPath").value =
      "";
  }

  if ($("differentRoutes")) {
    $("differentRoutes").checked =
      false;
  }

  cargarSelectCategoriasWebview();

  if ($("nativeLoginPath")) {
    $("nativeLoginPath").value =
      "";
  }

  if ($("nativeLandingUrl")) {
    $("nativeLandingUrl").value =
      "";
  }

  cargarSelectCategoriasNativo();

  setModoWebNativo(
    "login"
  );

  if ($("sameRouteBlock")) {
    $("sameRouteBlock")
      .classList
      .remove(
        "hidden"
      );
  }

  if (
    $("differentRoutesBlock")
  ) {
    $("differentRoutesBlock")
      .classList
      .add(
        "hidden"
      );
  }

  if (resetTipo) {
    setTipoDestino(
      "webview"
    );
  }

  previsualizarRutasGeneradas();
}

function cargarConstructorDesdeProducto(
  productoOriginal
) {
  limpiarCamposConstructor(
    false
  );

  const producto =
    resolverProducto(
      productoOriginal
    );

  setTipoDestino(
    producto.tipo
  );

  if (
    producto.tipo === "webview"
  ) {
    const rutaWeb =
      producto.rutaWeb;

    const rutaApp =
      producto.rutaApp;

    if (
      rutaWeb &&
      rutaApp &&
      rutaWeb !== rutaApp
    ) {
      $("differentRoutes").checked =
        true;

      manejarRutasDiferentes();

      $("webviewWebPath").value =
        rutaWeb;

      $("webviewAppPath").value =
        rutaApp;

    } else {
      $("differentRoutes").checked =
        false;

      manejarRutasDiferentes();

      seleccionarRutaWebviewEnCatalogo(
        rutaApp ||
        rutaWeb ||
        ""
      );
    }

  } else {
    const webProducto =
      limpiarValor(
        producto.web || ""
      );

    const rutaLogin =
      extraerParametro(
        webProducto,
        "redirectTo"
      ) ||
      extraerParametro(
        webProducto,
        "redirecto"
      );

    if (
      webProducto.startsWith(
        "https://mi.scotiabank.com.pe/login"
      ) &&
      rutaLogin
    ) {
      setModoWebNativo(
        "login"
      );

      $("nativeLoginPath").value =
        rutaLogin;

      $("nativeLandingUrl").value =
        "";

    } else {
      setModoWebNativo(
        "landing"
      );

      $("nativeLandingUrl").value =
        webProducto;

      $("nativeLoginPath").value =
        "";
    }

    const appBase =
      extraerBaseDeeplinkNativo(
        producto.app || ""
      );

    const normalizedPath =
      appBase
        ? "/" +
          appBase.replace(
            /^\/+/,
            ""
          )
        : "";

    if (normalizedPath) {
      seleccionarRutaNativoEnCatalogo(
        normalizedPath
      );
    }
  }

  previsualizarRutasGeneradas();
}

function obtenerRutasDesdeConstructor() {
  const tipo =
    getTipoDestino();

  if (
    tipo === "webview"
  ) {
    const diferentes =
      $("differentRoutes")
        .checked;

    let rutaWeb =
      "";

    let rutaApp =
      "";

    if (diferentes) {
      rutaWeb =
        normalizarRuta(
          $("webviewWebPath")
            .value
        );

      rutaApp =
        normalizarRuta(
          $("webviewAppPath")
            .value
        );

    } else {
      const ruta =
        normalizarRuta(
          $("webviewPath")
            .value
        );

      rutaWeb =
        ruta;

      rutaApp =
        ruta;
    }

    return {
      tipo,

      web:
        rutaWeb
          ? WEB_LOGIN_BASE +
            rutaWeb
          : "",

      app:
        rutaApp
          ? APP_WEBVIEW_BASE +
            rutaApp
          : ""
    };
  }

  const modoWeb =
    getModoWebNativo();

  const web =
    modoWeb === "login"
      ? construirWebNativaLogin(
          $("nativeLoginPath")
            .value
        )
      : construirWebNativaLanding(
          $("nativeLandingUrl")
            .value
        );

  const app =
    normalizarDestinoAppNativo(
      $("nativeAppDestination")
        .value
    );

  return {
    tipo,
    modoWeb,
    web,
    app
  };
}

function previsualizarRutasGeneradas() {
  const box =
    $("routePreviewBox");

  if (!box) {
    return;
  }

  const rutas =
    obtenerRutasDesdeConstructor();

  const nombre =
    rutas.tipo === "webview"
      ? "WebView"
      : "Nativo";

  let detalleModo =
    "";

  if (
    rutas.tipo === "native"
  ) {
    detalleModo =
      rutas.modoWeb === "login"
        ? "<br><br><strong>Modo Web:</strong> Ruta interna vía /login"
        : "<br><br><strong>Modo Web:</strong> Landing / URL directa";
  }

  box.innerHTML =
    "<strong>Vista previa — " +
    nombre +
    "</strong><br><br>" +

    "<strong>Web:</strong><br>" +
    (
      rutas.web ||
      "Pendiente"
    ) +

    "<br><br>" +

    "<strong>App:</strong><br>" +
    (
      rutas.app ||
      "Pendiente"
    ) +

    detalleModo;
}

function generarRutasDestino() {
  const rutas =
    obtenerRutasDesdeConstructor();

  if (!rutas.web) {
    if (
      rutas.tipo === "native" &&
      rutas.modoWeb === "landing"
    ) {
      alert(
        "Completa una URL HTTPS para la landing / fallback."
      );
    } else {
      alert(
        "Completa la ruta Web de fallback."
      );
    }

    return false;
  }

  if (
    !esUrlWebValida(
      rutas.web
    )
  ) {
    alert(
      "La URL Web generada no parece válida."
    );

    return false;
  }

  if (!rutas.app) {
    alert(
      "Selecciona o completa el destino App."
    );

    return false;
  }

  if (
    !esDeeplinkValido(
      rutas.app
    )
  ) {
    alert(
      "El Deeplink App generado no parece válido."
    );

    return false;
  }

  $("webUrl").value =
    rutas.web;

  $("appUrl").value =
    rutas.app;

  cargarProbadorRutas(
    rutas.web,
    rutas.app,
    productoSeleccionado
      ? productoSeleccionado.nombre
      : "Destino nuevo"
  );

  ocultarResultado();

  AUTO_GENERATED_LINKS =
    [];

  if ($("autoResultsCard")) {
    $("autoResultsCard")
      .classList
      .add(
        "hidden"
      );
  }
  return true;
}

function guardarRutasYVolver() {
  const correcto = generarRutasDestino();
  if (!correcto) return;
  cambiarModulo("generador");
  irAlPaso(2, true);
  if ($("wizardValidation")) {
    $("wizardValidation").classList.remove("hidden");
    $("wizardValidation").classList.add("success");
    $("wizardValidation").textContent = "Rutas Web y App guardadas. Revísalas en este paso y continúa cuando estén correctas.";
  }
}

function limpiarConstructor() {
  if ($("productSelect")) {
    $("productSelect").value =
      "";
  }

  productoSeleccionado =
    null;

  limpiarCamposConstructor(
    true
  );

  if ($("webUrl")) {
    $("webUrl").value =
      "";
  }

  if ($("appUrl")) {
    $("appUrl").value =
      "";
  }

  limpiarProbador();

  ocultarResultado();

  resetAutogenerador();

  renderCatalog();
}


/* =========================================================
   SOURCE / MEDIUM
========================================================= */

function obtenerMediosFuente(source) {
  const config =
    CAMPAIGN_SOURCES[
      source
    ];

  /*
    Compatibilidad estructura antigua:

    "google": [
      "paid-cpc",
      "display"
    ]
  */

  if (
    Array.isArray(
      config
    )
  ) {
    return config;
  }

  /*
    Estructura nueva:

    "google": {
      "medios": [...],
      "autogenerar": [...]
    }
  */

  if (
    config &&
    Array.isArray(
      config.medios
    )
  ) {
    return config.medios;
  }

  return [];
}

function obtenerMediosAutogenerar(source) {
  const config =
    CAMPAIGN_SOURCES[
      source
    ];

  if (
    Array.isArray(
      config
    )
  ) {
    return config;
  }

  if (
    config &&
    Array.isArray(
      config.autogenerar
    )
  ) {
    return config.autogenerar;
  }

  return obtenerMediosFuente(
    source
  );
}

function cargarSelectFuentes() {
  const select =
    $("utmSource");

  const medium =
    $("utmMedium");

  if (
    !select ||
    !medium
  ) {
    return;
  }

  select.innerHTML =
    '<option value="">Seleccionar fuente...</option>';

  Object.keys(
    CAMPAIGN_SOURCES || {}
  ).forEach(
    source => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        source;

      const nombre =
        SOURCE_NAMES[
          source
        ];

      option.textContent =
        nombre
          ? source +
            " — " +
            nombre
          : source;

      select.appendChild(
        option
      );
    }
  );

  const otro =
    document.createElement(
      "option"
    );

  otro.value =
    "__otro__";

  otro.textContent =
    "Otro — Escribir manualmente";

  select.appendChild(
    otro
  );

  medium.innerHTML =
    '<option value="">Primero selecciona una fuente...</option>';

  medium.disabled =
    true;
}

function cargarMediosPorFuente() {
  const sourceSelect =
    $("utmSource");

  const mediumSelect =
    $("utmMedium");

  const sourceOtro =
    $("utmSourceOtro");

  const mediumOtro =
    $("utmMediumOtro");

  const source =
    sourceSelect.value;

  mediumOtro
    .classList
    .add(
      "hidden"
    );

  mediumOtro.value =
    "";

  if (!source) {
    mediumSelect.innerHTML =
      '<option value="">Primero selecciona una fuente...</option>';

    mediumSelect.disabled =
      true;

    return;
  }

  if (
    source === "__otro__"
  ) {
    sourceOtro
      .classList
      .remove(
        "hidden"
      );

    sourceOtro.focus();

    mediumSelect.innerHTML =
      '<option value="">Seleccionar medio...</option>';

    Object.keys(
      MEDIUM_NAMES || {}
    ).forEach(
      medium => {
        const option =
          document.createElement(
            "option"
          );

        option.value =
          medium;

        option.textContent =
          MEDIUM_NAMES[
            medium
          ]
            ? medium +
              " — " +
              MEDIUM_NAMES[
                medium
              ]
            : medium;

        mediumSelect.appendChild(
          option
        );
      }
    );

    const otro =
      document.createElement(
        "option"
      );

    otro.value =
      "__otro__";

    otro.textContent =
      "Otro — Escribir manualmente";

    mediumSelect.appendChild(
      otro
    );

    mediumSelect.disabled =
      false;

    return;
  }

  sourceOtro
    .classList
    .add(
      "hidden"
    );

  sourceOtro.value =
    "";

  const medios =
    obtenerMediosFuente(
      source
    );

  mediumSelect.innerHTML =
    '<option value="">Seleccionar medio...</option>';

  medios.forEach(
    medium => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        medium;

      const nombre =
        MEDIUM_NAMES[
          medium
        ];

      option.textContent =
        nombre
          ? medium +
            " — " +
            nombre
          : medium;

      mediumSelect.appendChild(
        option
      );
    }
  );

  const otro =
    document.createElement(
      "option"
    );

  otro.value =
    "__otro__";

  otro.textContent =
    "Otro — Escribir manualmente";

  mediumSelect.appendChild(
    otro
  );

  mediumSelect.disabled =
    false;

  if (
    medios.length === 1
  ) {
    mediumSelect.value =
      medios[0];
  }
}

function manejarOtroSource() {
  const select =
    $("utmSource");

  const inputOtro =
    $("utmSourceOtro");

  if (
    select.value === "__otro__"
  ) {
    inputOtro
      .classList
      .remove(
        "hidden"
      );
  } else {
    inputOtro
      .classList
      .add(
        "hidden"
      );

    inputOtro.value =
      "";
  }

  cargarMediosPorFuente();
}

function manejarOtroMedium() {
  const select =
    $("utmMedium");

  const inputOtro =
    $("utmMediumOtro");

  if (
    select.value === "__otro__"
  ) {
    inputOtro
      .classList
      .remove(
        "hidden"
      );

    inputOtro.focus();

  } else {
    inputOtro
      .classList
      .add(
        "hidden"
      );

    inputOtro.value =
      "";
  }
}


/* =========================================================
   CONSTRUCCIÓN DE ENLACES — CAMPAÑA E INTERNOS
   Se preservan rutas funcionales y se eliminan parámetros
   de marketing anteriores para evitar etiquetas heredadas.
========================================================= */

function obtenerModoMedicion() {
  const radio = document.querySelector('input[name="measurementMode"]:checked');
  return radio ? radio.value : "campana";
}

function obtenerModoDestinoEnlace() {
  const radio = document.querySelector('input[name="linkDestinationMode"]:checked');
  return radio ? radio.value : "combinado";
}

function limpiarParametrosMedicion(url) {
  const original = limpiarValor(url);
  if (!original) return "";
  const eliminar = obtenerParesParametros(original)
    .filter(item => /^utm_/i.test(item.key) || item.key === "_gl" ||
      item.key === "source")
    .map(item => item.key);
  return establecerParametros(original, {}, eliminar);
}

function insertarEmbeddedSinEncodear(web, app) {
  if (!app) return web;
  const hashPos = web.indexOf("#");
  const parte = hashPos < 0 ? web : web.slice(0, hashPos);
  const hash = hashPos < 0 ? "" : web.slice(hashPos);
  return parte + (parte.includes("?") ? "&" : "?") + "embeddedURL=" + app + hash;
}

function construirVariantesEnlace(config) {
  const {
    webBase, appBase = "", modoMedicion = "campana", modoDestino = "combinado",
    utmSource = "", utmMedium = "", utmCampaign = "", utmTerm = "", utmContent = "", detail = "",
    sourceCampanaInterno = false, sourceExtra = undefined
  } = config;

  // Un enlace real puede tener embeddedURL ya incluido en la URL Web.
  const appOriginal = modoDestino !== "web"
    ? (limpiarValor(appBase) || extraerParametro(webBase, "embeddedURL"))
    : "";
  const webLimpia = limpiarParametrosMedicion(webBase);
  const appLimpia = limpiarParametrosMedicion(appOriginal);
  const parametros = modoMedicion === "campana" ? {
    utm_source: normalizarTaxonomia(utmSource),
    utm_medium: normalizarTaxonomia(utmMedium),
    utm_campaign: limpiarValor(utmCampaign),
    utm_term: limpiarValor(utmTerm),
    utm_content: limpiarValor(utmContent)
  } : {};
  const valorSource = sourceExtra === undefined
    ? (modoMedicion === "campana" || sourceCampanaInterno ? SOURCE_CAMPAIGN : "")
    : limpiarValor(sourceExtra);
  if (valorSource) parametros.source = valorSource;

  // El campo detail vacío no debe dejar un detail antiguo de otro enlace.
  if (limpiarValor(detail)) parametros.detail = limpiarValor(detail);

  const webParametrizada = webLimpia
    ? establecerParametros(webLimpia, parametros, ["embeddedURL", "detail"])
    : "";
  const appParametrizada = appLimpia
    ? establecerParametros(appLimpia, parametros, ["detail"])
    : "";
  const finalUrl = modoDestino === "app"
    ? appParametrizada
    : (appParametrizada
      ? establecerParametros(webParametrizada, { embeddedURL: appParametrizada })
      : webParametrizada);

  return {
    modoMedicion, modoDestino,
    source: modoMedicion === "campana" ? normalizarTaxonomia(utmSource) : "",
    medium: modoMedicion === "campana" ? normalizarTaxonomia(utmMedium) : "",
    campaign: modoMedicion === "campana" ? limpiarValor(utmCampaign) : "",
    term: modoMedicion === "campana" ? limpiarValor(utmTerm) : "",
    content: modoMedicion === "campana" ? limpiarValor(utmContent) : "",
    sourceCampanaInterno: modoMedicion === "interno" && !!sourceCampanaInterno,
    sourceExtra: parametros.source || "",
    detail: limpiarValor(detail),
    finalUrl,
    finalUrlSinEncodear: modoDestino === "app" ? appParametrizada : insertarEmbeddedSinEncodear(webParametrizada, appParametrizada),
    webParametrizada,
    webEncodeada: encodeURIComponent(webParametrizada),
    appParametrizada,
    appEncodeada: appParametrizada ? encodeURIComponent(appParametrizada) : ""
  };
}

// Compatibilidad con la generación masiva de campañas.
function construirVariantesCampana(webBase, appBase, utmSource, utmMedium,
  utmCampaign, detail = "", utmTerm = "", modoDestino = "combinado", utmContent = "", sourceExtra = SOURCE_CAMPAIGN) {
  return construirVariantesEnlace({
    webBase, appBase, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, detail,
    modoDestino, modoMedicion: "campana", sourceExtra
  });
}

function marcarSourceEditado() {
  if ($("sourceInternal")) $("sourceInternal").dataset.sourceEditado = "true";
}

function actualizarModoMedicion() {
  const interno = obtenerModoMedicion() === "interno";
  if ($("campaignFields")) $("campaignFields").classList.toggle("hidden", interno);
  if ($("internalModeNote")) $("internalModeNote").classList.toggle("hidden", !interno);
  // Un único campo source: escribirlo lo incluye; dejarlo vacío lo omite.
  const field = $("sourceInternal");
  if (field && field.dataset.sourceEditado !== "true") field.value = interno ? "" : SOURCE_CAMPAIGN;
  if ($("multipleCampaignCard")) $("multipleCampaignCard").classList.toggle("hidden", interno || obtenerModoDestinoEnlace() === "clientes");
  if ($("oneLinkDescription")) $("oneLinkDescription").textContent = interno
    ? "Genera una URL sin UTM; puedes agregar source y detail si el destino los admite."
    : "Genera un enlace con las UTM del Paso 3 y los extras opcionales.";
  if ($("autoGeneratorPanel")) $("autoGeneratorPanel").classList.add("hidden");
  if ($("autoResultsCard")) $("autoResultsCard").classList.add("hidden");
  ocultarResultado();
  actualizarResumenGuiado();
}

function actualizarModoDestino() {
  const modo = obtenerModoDestinoEnlace();
  const mensajes = {
    web: "Genera un enlace HTTPS directo, sin embeddedURL. Útil para landings, Open Market y login web.",
    app: "Genera un deeplink directo. Algunos canales (email, QR y navegadores) pueden bloquearlo y NO hay fallback web garantizado.",
    combinado: "Combina login web (redirectTo) y deeplink de App (embeddedURL). Puede funcionar en rutas compatibles, pero hay que validarlo por dispositivo y canal.",
    clientes: "Prepara la ruta para clientes y la landing para no clientes por separado. La identificación del cliente y el fallback están PENDIENTES de Tecnología."
  };
  if ($("destinationModeHelp")) $("destinationModeHelp").textContent = mensajes[modo];
  if ($("nonClientFallbackPanel")) $("nonClientFallbackPanel").classList.toggle("hidden", modo !== "clientes");
  if ($("multipleCampaignCard")) $("multipleCampaignCard").classList.toggle("hidden", modo === "clientes" || obtenerModoMedicion() === "interno");
  if ($("webRequiredInfo")) $("webRequiredInfo").textContent = modo === "app" ? "· opcional" : "· obligatorio";
  if ($("appRequiredInfo")) $("appRequiredInfo").textContent = modo === "web" ? "· no se utiliza" : "· obligatorio";
  const guiado = document.querySelector('input[name="guidedIntent"][value="' + modo + '"]');
  if (guiado && !guiado.checked) guiado.checked = true;
  ocultarResultado();
  if ($("autoResultsCard")) $("autoResultsCard").classList.add("hidden");
  actualizarResumenGuiado();
}

/* =========================================================
   ASISTENTE GUIADO PARA MARKETING (V3.0)
========================================================= */
function establecerModoGuiado(modo) {
  const radio = document.querySelector('input[name="linkDestinationMode"][value="' + modo + '"]');
  if (radio) radio.checked = true;
  actualizarModoDestino();
}

function cambiarObjetivoGuiado() {
  const radio = document.querySelector('input[name="guidedIntent"]:checked');
  establecerModoGuiado(radio ? radio.value : "web");
}

function seleccionarTaxonomiaSugerida(source, medium) {
  const fuente = $("utmSource");
  if (!fuente) return;
  if ([...fuente.options].some(item => item.value === source)) {
    fuente.value = source;
    manejarOtroSource();
  } else {
    fuente.value = "__otro__";
    manejarOtroSource();
    $("utmSourceOtro").value = source;
  }
  const medio = $("utmMedium");
  if (medio && [...medio.options].some(item => item.value === medium)) {
    medio.value = medium;
    manejarOtroMedium();
  } else if (medio) {
    medio.value = "__otro__";
    manejarOtroMedium();
    $("utmMediumOtro").value = medium;
  }
}

function cambiarCanalGuiado() {
  const canal = $("guidedChannel") ? $("guidedChannel").value : "";
  const guia = GUIA_CANALES[canal];
  if (!guia) { actualizarConsejoCanal(); return; }
  const radio = document.querySelector('input[name="measurementMode"][value="' + (guia.utm ? "campana" : "interno") + '"]');
  if (radio) radio.checked = true;
  if (guia.utm && guia.source && guia.medium) seleccionarTaxonomiaSugerida(guia.source, guia.medium);
  if (guia.utm && guia.ejemplo && !limpiarValor($("utmCampaign").value)) $("utmCampaign").placeholder = "Ej. " + guia.ejemplo;
  if (guia.utm && guia.content && !limpiarValor($("utmContent").value)) $("utmContent").placeholder = "Ej. " + guia.content;
  if (!guia.utm) { if ($("utmCampaign")) $("utmCampaign").value = ""; if ($("utmContent")) $("utmContent").value = ""; }
  actualizarModoMedicion();
  actualizarConsejoCanal();
}

function actualizarConsejoCanal() {
  const canal = $("guidedChannel") ? $("guidedChannel").value : "";
  const guia = GUIA_CANALES[canal];
  const mensaje = guia ? guia.consejo : "Elige dónde se utilizará el enlace. Sugeriremos fuente, medio y si necesitas UTM, usando el catálogo existente.";
  if ($("guidedChannelAdvice")) $("guidedChannelAdvice").textContent = "💡 " + mensaje;
  if ($("guidedMeasurementAdvice")) $("guidedMeasurementAdvice").textContent = "RECOMENDACIÓN · " + mensaje + (guia && guia.utm ? " Escribe un utm_campaign que distinga producto y período; utm_content es opcional." : "");
  actualizarResumenGuiado();
}

function actualizarResumenGuiado() {
  if (!$("guidedSummary")) return;
  const canal = $("guidedChannel") && $("guidedChannel").selectedOptions.length ? $("guidedChannel").selectedOptions[0].textContent : "Canal por definir";
  const tipo = {web:"Web directa", app:"Solo App", combinado:"App / Login Web", clientes:"Clientes / No clientes · SOLO PREPARACIÓN"};
  const modo = obtenerModoDestinoEnlace();
  const utm = obtenerModoMedicion() === "interno" ? "sin UTM" : "con UTM";
  $("guidedSummary").textContent = "Tu configuración: " + canal + " · " + (tipo[modo] || modo) + " · " + utm + ". Sigue al Paso 2: selecciona o pega el destino.";
}

function construirFichaTecnologia() {
  if (!RESULTADO_ACTUAL || RESULTADO_ACTUAL.modoDestino !== "clientes") return null;
  return {
    documento: "Solicitud de integración · clientes/no clientes · Generador Marketing v3.2",
    estado: "PENDIENTE_DE_TECNOLOGIA_NO_PUBLICABLE",
    canal: $("guidedChannel") ? $("guidedChannel").value : "",
    comportamiento_solicitado: "Cliente con App: abrir destino App (login si corresponde); cliente sin App: login web y redirigir; no cliente: landing comercial pública.",
    importante: "La instalación de App no prueba si alguien es cliente. Requiere autenticación/enrutamiento y no puede determinarse desde el generador.",
    cliente_url_web: RESULTADO_ACTUAL.webParametrizada,
    cliente_deeplink_app: RESULTADO_ACTUAL.appParametrizada,
    cliente_url_combinada_para_pruebas: RESULTADO_ACTUAL.finalUrl,
    no_cliente_landing: limpiarValor($("nonClientLandingUrl").value),
    parametros: {utm_source:RESULTADO_ACTUAL.source, utm_medium:RESULTADO_ACTUAL.medium, utm_campaign:RESULTADO_ACTUAL.campaign, utm_content:RESULTADO_ACTUAL.content, utm_term:RESULTADO_ACTUAL.term, detail:RESULTADO_ACTUAL.detail, source_campaign_sin_utm: RESULTADO_ACTUAL.sourceCampanaInterno},
    criterios_aceptacion: ["Cliente con App → ruta App", "Cliente sin App → login Web → destino", "No cliente → landing indicada sin login del banco", "Sin App no implica no cliente", "Validación Android/iOS/desktop", "Preservar y registrar parámetros aprobados", "QA de seguridad y medición"]
  };
}

async function copiarFichaTecnologia() {
  const ficha = construirFichaTecnologia();
  if (!ficha) return;
  const ok = await escribirPortapapeles(JSON.stringify(ficha, null, 2));
  alert(ok ? "Ficha técnica copiada para Tecnología." : "No se pudo copiar. Usa Descargar ficha JSON.");
}

function descargarFichaTecnologia() {
  const ficha = construirFichaTecnologia();
  if (!ficha) return;
  const blob = new Blob([JSON.stringify(ficha, null, 2)], {type:"application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "requerimiento-clientes-no-clientes.json";
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* =========================================================
   V3.2 · NAVEGACIÓN GUIADA Y VALIDACIÓN
========================================================= */
let PASO_ACTUAL = 1;

function mostrarAvisoPaso(mensaje, campo) {
  const aviso = $("wizardValidation");
  if (!aviso) return false;
  aviso.textContent = mensaje;
  aviso.className = "wizard-validation";
  if (campo && typeof campo.focus === "function") campo.focus({preventScroll:true});
  return false;
}

function limpiarAvisoPaso() {
  const aviso = $("wizardValidation");
  if (aviso) { aviso.textContent = ""; aviso.className = "wizard-validation hidden"; }
}

function validarPaso(n) {
  const modo = obtenerModoDestinoEnlace();
  const medicion = obtenerModoMedicion();
  if (n === 1) {
    if (!limpiarValor($("guidedChannel")?.value))
      return mostrarAvisoPaso("Selecciona dónde vas a compartir el enlace para continuar.",$("guidedChannel"));
  }
  if (n === 2) {
    const web = limpiarValor($("webUrl")?.value);
    const app = limpiarValor($("appUrl")?.value) || extraerParametro(web,"embeddedURL");
    if (modo !== "app" && (!web || !esUrlWebValida(web)))
      return mostrarAvisoPaso("Falta la URL Web válida. Pégala aquí o búscala en el catálogo.",$("webUrl"));
    if (modo !== "web" && (!app || !esDeeplinkValido(app)))
      return mostrarAvisoPaso("Falta el deeplink App válido. Pégalo aquí o usa Configurar destino.",$("appUrl"));
    if (modo === "clientes" && !esUrlWebValida($("nonClientLandingUrl")?.value))
      return mostrarAvisoPaso("Completa una landing HTTPS para no clientes. Este flujo sigue pendiente de Tecnología.",$("nonClientLandingUrl"));
  }
  if (n === 3) {
    if (medicion === "campana") {
      const selSource = $("utmSource")?.value;
      const selMedium = $("utmMedium")?.value;
      const src = limpiarValor(selSource === "__otro__" ? $("utmSourceOtro")?.value : selSource);
      const med = limpiarValor(selMedium === "__otro__" ? $("utmMediumOtro")?.value : selMedium);
      if (!src) return mostrarAvisoPaso("Completa utm_source para identificar el origen de la campaña.",$("utmSource"));
      if (!med) return mostrarAvisoPaso("Completa utm_medium para identificar el medio de la campaña.",$("utmMedium"));
      if (!limpiarValor($("utmCampaign")?.value))
        return mostrarAvisoPaso("Completa utm_campaign con el nombre de campaña.",$("utmCampaign"));
    }
  }
  return true;
}

function actualizarVistaPasos() {
  document.querySelectorAll('[data-step-section="true"]').forEach(sec => {
    sec.classList.toggle("hidden", Number(sec.dataset.wizardStep) !== PASO_ACTUAL);
  });
  const faq = document.querySelector('.faq-marketing');
  if (faq) faq.classList.toggle("hidden", PASO_ACTUAL !== 4);
  const autogen = $("autoResultsCard");
  if (autogen && PASO_ACTUAL !== 4) autogen.classList.add("hidden");
  document.querySelectorAll('[data-progress-step]').forEach(btn => {
    const n = Number(btn.dataset.progressStep);
    btn.classList.toggle("current", n === PASO_ACTUAL);
    btn.classList.toggle("completed", n < PASO_ACTUAL);
    if (n === PASO_ACTUAL) btn.setAttribute("aria-current","step");
    else btn.removeAttribute("aria-current");
  });
}

function irAlPaso(n, omitirValidacion = false) {
  const nuevo = Number(n);
  if (nuevo < 1 || nuevo > 4) return false;
  if (!omitirValidacion && nuevo > PASO_ACTUAL) {
    for (let i = PASO_ACTUAL; i < nuevo; i++) {
      if (!validarPaso(i)) return false;
    }
  }
  limpiarAvisoPaso();
  PASO_ACTUAL = nuevo;
  actualizarVistaPasos();
  const progress = $("wizardProgress");
  if (progress) progress.scrollIntoView({behavior:"smooth",block:"start"});
  return true;
}

/* =========================================================
   GENERACIÓN INDIVIDUAL
========================================================= */

function generarLink() {
  const webBase = limpiarValor($("webUrl").value);
  const appBase = limpiarValor($("appUrl").value);
  const modoMedicion = obtenerModoMedicion();
  const modoDestino = obtenerModoDestinoEnlace();
  const sourceSeleccionado = $("utmSource").value;
  const mediumSeleccionado = $("utmMedium").value;
  const utmSource = normalizarTaxonomia(sourceSeleccionado === "__otro__"
    ? $("utmSourceOtro").value : sourceSeleccionado);
  const utmMedium = normalizarTaxonomia(mediumSeleccionado === "__otro__"
    ? $("utmMediumOtro").value : mediumSeleccionado);
  const utmCampaign = limpiarValor($("utmCampaign").value);
  const utmTerm = limpiarValor($("utmTerm").value);
  const utmContent = limpiarValor($("utmContent").value);
  const detail = limpiarValor($("detail").value);
  const sourceCampanaInterno = false; // compatibilidad con API previa; sourceExtra controla el parámetro.
  const sourceExtra = limpiarValor($("sourceInternal")?.value);

  if (modoDestino !== "app" && (!webBase || !esUrlWebValida(webBase))) {
    alert("Completa una URL Web válida en el Paso 2 (destino). En Solo App, la URL Web es opcional.");
    return;
  }
  const appEfectiva = appBase || extraerParametro(webBase, "embeddedURL");
  if (modoDestino !== "web" && (!appEfectiva || !esDeeplinkValido(appEfectiva))) {
    alert("Para esta modalidad necesitas un deeplink App válido en el Paso 2. Ejemplo: scotiabankpe:///notices");
    return;
  }
  if (modoDestino === "clientes" && !esUrlWebValida(limpiarValor($("nonClientLandingUrl").value))) {
    alert("Completa la landing HTTPS para no clientes. Quedará en la ficha para Tecnología, no en el enlace final.");
    return;
  }
  if (modoMedicion === "campana" && (!utmSource || !utmMedium || !utmCampaign)) {
    alert("En modo campaña, completa utm_source, utm_medium y utm_campaign.");
    return;
  }

  const resultado = construirVariantesEnlace({webBase, appBase,
    modoMedicion, modoDestino, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, detail, sourceCampanaInterno, sourceExtra});
  RESULTADO_ACTUAL = resultado;
  mostrarResultadoEnlace(resultado);
  const resultadoVisible = $("resultBox");
  if (resultadoVisible) resultadoVisible.scrollIntoView({behavior:"smooth",block:"center"});
}

function mostrarResultadoEnlace(resultado) {
  const vistas = {
    finalUrl: resultado.finalUrl,
    finalEncodedPreview: resultado.finalUrl,
    finalDecodedPreview: resultado.finalUrlSinEncodear,
    webPreview: resultado.webParametrizada || "No aplica — Solo App",
    webEncodedPreview: resultado.webEncodeada || "No aplica — Solo App",
    appPreview: resultado.appParametrizada || "No aplica — Solo Web",
    appEncodedPreview: resultado.appEncodeada || "No aplica — Solo Web"
  };
  Object.entries(vistas).forEach(([id, value]) => { if ($(id)) $(id).textContent = value; });
  const futuro = resultado.modoDestino === "clientes";
  const etiquetas = {web:"Solo Web", app:"Solo App", combinado:"App / Login Web", clientes:"Clientes / No clientes (propuesta)"};
  if ($("generationModeNote")) {
    const nota = $("generationModeNote");
    nota.className = "mode-note " + (futuro ? "experimental" : "informative");
    const medicion = resultado.modoMedicion === "interno" ? "Navegación interna · sin UTM" : "Campaña externa · con UTM";
    nota.textContent = medicion + " · " + etiquetas[resultado.modoDestino] + ". " +
      (resultado.sourceExtra ? "source=" + resultado.sourceExtra + " incluido. " : "") +
      (futuro ? "Esta modalidad NO detecta clientes ni hace fallback automático. No publicar hasta integrar con Tecnología." :
      "Construcción de URL correcta; falta validar navegación real y captura de parámetros.");
  }
  if ($("resultTitle")) $("resultTitle").textContent = futuro ? "⚠ Propuesta técnica · NO publicar" : "✓ Enlace construido · pendiente de pruebas";
  if ($("copyFinalButton")) {
    $("copyFinalButton").disabled = futuro;
    $("copyFinalButton").textContent = futuro ? "No publicar · pendiente de Tecnología" : "Copiar link final";
  }
  if ($("resultPublishNote")) $("resultPublishNote").className = futuro ? "warning" : "success-note";
  if ($("resultPublishNote")) $("resultPublishNote").innerHTML = futuro
    ? "<strong>No apto para publicación:</strong> el enlace mostrado es solo la ruta de clientes. Comparte la ficha de requisitos con Tecnología para habilitar la clasificación cliente/no cliente."
    : "<strong>Antes de publicar:</strong> comprueba el destino, las UTM (si aplica), la apertura de App en Android/iOS y la captura real en Analytics. Esta herramienta no valida el servidor.";
  if ($("nonClientResult")) $("nonClientResult").classList.toggle("hidden", !futuro);
  if ($("nonClientResultUrl")) $("nonClientResultUrl").textContent = futuro ? limpiarValor($("nonClientLandingUrl").value) : "";
  if ($("resultBox")) $("resultBox").classList.add("visible");
  if ($("emptyResult")) $("emptyResult").classList.add("hidden");
  if ($("testFinalLink")) $("testFinalLink").value = resultado.finalUrl;
  if ($("testWebLink")) $("testWebLink").value = resultado.webParametrizada;
  if ($("testAppLink")) $("testAppLink").value = resultado.appParametrizada;
  actualizarEnlaceApp();
}

function ocultarResultado() {
  RESULTADO_ACTUAL = null;
  if ($("resultBox")) {
    $("resultBox")
      .classList
      .remove(
        "visible"
      );
  }

  if ($("emptyResult")) {
    $("emptyResult")
      .classList
      .remove(
        "hidden"
      );
  }

  const modeNote =
    $("generationModeNote");

  if (modeNote) {
    modeNote.className =
      "mode-note hidden";

    modeNote.innerHTML =
      "";
  }
}

async function copiarValor(
  elementId,
  nombre = "Valor"
) {
  const element =
    $(elementId);

  const valor =
    element
      ? element.textContent
      : "";

  if (!valor) {
    return;
  }

  const copiado = await escribirPortapapeles(valor);
  alert(copiado ? nombre + " copiado correctamente." :
    "No se pudo copiar automáticamente. Selecciona y copia el texto manualmente.");
}

async function copiarFinal() {
  const link =
    $("finalUrl")
      ? $("finalUrl")
          .textContent
      : "";

  if (!link) {
    return;
  }

  const copiado = await escribirPortapapeles(link);
  alert(copiado ? "Link copiado correctamente." :
    "No se pudo copiar automáticamente. Selecciona el enlace y cópialo manualmente.");
}

function abrirFinal() {
  const link =
    $("finalUrl")
      ? $("finalUrl")
          .textContent
      : "";

  if (link) {
    window.location.href =
      link;
  }
}


/* =========================================================
   AUTOGENERADOR
========================================================= */

function mostrarAutogenerador() {
  const panel =
    $("autoGeneratorPanel");

  if (!panel) {
    return;
  }

  renderFuentesAutogenerador();

  panel
    .classList
    .remove(
      "hidden"
    );

  panel.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

function cerrarAutogenerador() {
  const panel =
    $("autoGeneratorPanel");

  if (panel) {
    panel
      .classList
      .add(
        "hidden"
      );
  }
}

function renderFuentesAutogenerador() {
  const contenedor =
    $("autoSourcesList");

  if (!contenedor) {
    return;
  }

  const sources =
    Object.keys(
      CAMPAIGN_SOURCES || {}
    );

  if (
    !sources.length
  ) {
    contenedor.innerHTML =
      '<div class="data-status">Los canales disponibles se cargarán desde <strong>campanas.json</strong>.</div>';

    return;
  }

  contenedor.innerHTML =
    "";

  sources.forEach(
    source => {
      const medios =
        obtenerMediosAutogenerar(
          source
        );

      const item =
        document.createElement(
          "label"
        );

      item.className =
        "auto-source-option";

      const checkbox =
        document.createElement(
          "input"
        );

      checkbox.type =
        "checkbox";

      checkbox.className =
        "auto-source-checkbox";

      checkbox.value =
        source;

      const texto =
        document.createElement(
          "span"
        );

      texto.className =
        "auto-source-text";

      const titulo =
        document.createElement(
          "strong"
        );

      titulo.textContent =
        SOURCE_NAMES[
          source
        ]
          ? source +
            " — " +
            SOURCE_NAMES[
              source
            ]
          : source;

      const detalle =
        document.createElement(
          "small"
        );

      detalle.textContent =
        medios.length
          ? "Autogenerar: " +
            medios.join(", ")
          : "Sin combinaciones configuradas para autogenerar";

      texto.append(
        titulo,
        detalle
      );

      item.append(
        checkbox,
        texto
      );

      contenedor.appendChild(
        item
      );
    }
  );
}

function seleccionarTodasFuentesAuto() {
  document
    .querySelectorAll(
      ".auto-source-checkbox"
    )
    .forEach(
      input => {
        input.checked =
          true;
      }
    );
}

function limpiarFuentesAuto() {
  document
    .querySelectorAll(
      ".auto-source-checkbox"
    )
    .forEach(
      input => {
        input.checked =
          false;
      }
    );
}

function obtenerFuentesAutoSeleccionadas() {
  return Array.from(
    document.querySelectorAll(
      ".auto-source-checkbox:checked"
    )
  ).map(
    input =>
      input.value
  );
}

function validarBaseAutogenerador() {
  const webBase =
    limpiarValor(
      $("webUrl")
        .value
    );

  const appBase =
    limpiarValor(
      $("appUrl")
        .value
    );

  const utmCampaign =
    limpiarValor(
      $("utmCampaign")
        .value
    );

  const detail = limpiarValor($("detail").value);
  const utmTerm = limpiarValor($("utmTerm").value);
  const modoDestino = obtenerModoDestinoEnlace();
  const utmContent = limpiarValor($("utmContent").value);
  if (modoDestino === "clientes") {
    alert("Clientes / No clientes es una propuesta para Tecnología. No se puede generar un lote publicable todavía.");
    return null;
  }
  if (
    modoDestino !== "app" && (!webBase || !esUrlWebValida(webBase))
  ) {
    alert(
      "Completa una URL Web válida antes de autogenerar."
    );

    return null;
  }

  const appEfectiva = appBase || extraerParametro(webBase, "embeddedURL");
  if (modoDestino !== "web" && (!appEfectiva || !esDeeplinkValido(appEfectiva))) {
    alert("Para generar estos links, completa un deeplink válido o cambia a Solo Web.");
    return null;
  }

  if (!utmCampaign) {
    alert(
      "Completa utm_campaign antes de autogenerar."
    );

    return null;
  }

  return {
    webBase,
    appBase,
    utmCampaign,
    utmTerm,
    utmContent,
    modoDestino,
    detail
  };
}

function autogenerarLinks() {
  if (obtenerModoMedicion() !== "campana") {
    alert("La autogeneración por canales solo está disponible para campañas con UTM.");
    return;
  }
  const base =
    validarBaseAutogenerador();

  if (!base) {
    return;
  }

  const fuentes =
    obtenerFuentesAutoSeleccionadas();

  if (
    !fuentes.length
  ) {
    alert(
      "Selecciona al menos un canal para autogenerar."
    );

    return;
  }

  const resultados =
    [];

  fuentes.forEach(
    source => {
      const medios =
        obtenerMediosAutogenerar(
          source
        );

      medios.forEach(
        medium => {
          resultados.push(
            construirVariantesCampana(
              base.webBase,
              base.appBase,
              source,
              medium,
              base.utmCampaign,
              base.detail,
              base.utmTerm,
              base.modoDestino,
              base.utmContent,
              limpiarValor($("sourceInternal")?.value)
            )
          );
        }
      );
    }
  );

  if (
    !resultados.length
  ) {
    alert(
      "Las fuentes seleccionadas no tienen combinaciones configuradas en autogenerar."
    );

    return;
  }

  AUTO_GENERATED_LINKS =
    resultados;

  renderResultadosAutogenerados();

  const card =
    $("autoResultsCard");

  if (card) {
    card
      .classList
      .remove(
        "hidden"
      );

    card.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function renderResultadosAutogenerados() {
  const body =
    $("autoResultsBody");

  const empty =
    $("autoResultsEmpty");

  const content =
    $("autoResultsContent");

  const summary =
    $("autoResultsSummary");

  if (
    !body ||
    !empty ||
    !content ||
    !summary
  ) {
    return;
  }

  body.innerHTML =
    "";

  if (
    !AUTO_GENERATED_LINKS.length
  ) {
    empty
      .classList
      .remove(
        "hidden"
      );

    content
      .classList
      .add(
        "hidden"
      );

    return;
  }

  AUTO_GENERATED_LINKS.forEach(
    (item, index) => {
      const tr =
        document.createElement(
          "tr"
        );

      const tdSource =
        document.createElement(
          "td"
        );

      tdSource.textContent =
        item.source;


      const tdMedium =
        document.createElement(
          "td"
        );

      tdMedium.textContent =
        item.medium;


      const tdLink =
        document.createElement(
          "td"
        );

      const linkBox =
        document.createElement(
          "div"
        );

      linkBox.className =
        "auto-link-value";

      linkBox.textContent =
        item.finalUrl;

      tdLink.appendChild(
        linkBox
      );


      const tdActions =
        document.createElement(
          "td"
        );

      tdActions.className =
        "auto-row-actions";


      const copyBtn =
        document.createElement(
          "button"
        );

      copyBtn.className =
        "btn-secondary";

      copyBtn.textContent =
        "Copiar";

      copyBtn.onclick =
        () =>
          copiarLinkAuto(
            index
          );


      const testBtn =
        document.createElement(
          "button"
        );

      testBtn.className =
        "btn-secondary";

      testBtn.textContent =
        "Probar";

      testBtn.onclick =
        () =>
          probarLinkAuto(
            index
          );


      tdActions.append(
        copyBtn,
        testBtn
      );

      tr.append(
        tdSource,
        tdMedium,
        tdLink,
        tdActions
      );

      body.appendChild(
        tr
      );
    }
  );

  const fuentesUnicas =
    new Set(
      AUTO_GENERATED_LINKS
        .map(
          item =>
            item.source
        )
    ).size;

  summary.innerHTML =
    "<strong>Autogeneración completada</strong><br><br>" +
    "Se generaron <strong>" +
    AUTO_GENERATED_LINKS.length +
    " links</strong> para <strong>" +
    fuentesUnicas +
    " fuentes</strong>.";

  empty
    .classList
    .add(
      "hidden"
    );

  content
    .classList
    .remove(
      "hidden"
    );
}

async function copiarLinkAuto(index) {
  const item =
    AUTO_GENERATED_LINKS[
      index
    ];

  if (!item) {
    return;
  }

  const copiado = await escribirPortapapeles(item.finalUrl);
  alert(copiado ? "Link copiado: " + item.source + " / " + item.medium :
    "No se pudo copiar automáticamente. Copia el enlace desde la tabla.");
}

function probarLinkAuto(index) {
  const item =
    AUTO_GENERATED_LINKS[
      index
    ];

  if (
    item &&
    item.finalUrl
  ) {
    window.location.href =
      item.finalUrl;
  }
}

async function copiarTodosLinksAuto() {
  if (
    !AUTO_GENERATED_LINKS.length
  ) {
    alert(
      "No hay links autogenerados para copiar."
    );

    return;
  }

  const texto =
    AUTO_GENERATED_LINKS
      .map(
        item =>
          item.source +
          "\t" +
          item.medium +
          "\t" +
          item.finalUrl
      )
      .join(
        "\n"
      );

  const copiado = await escribirPortapapeles(texto);
  alert(copiado ? AUTO_GENERATED_LINKS.length + " links copiados correctamente." :
    "No se pudo copiar automáticamente. Puedes descargar el CSV.");
}

function escaparCsv(valor) {
  const texto =
    String(
      valor ?? ""
    );

  return (
    '"' +
    texto.replace(
      /"/g,
      '""'
    ) +
    '"'
  );
}

function descargarLinksAutoCsv() {
  if (
    !AUTO_GENERATED_LINKS.length
  ) {
    alert(
      "No hay links autogenerados para descargar."
    );

    return;
  }

  const filas = [
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "detail",
      "link_final",
      "link_final_sin_encodear",
      "web_sin_encodear",
      "web_encodeado",
      "app_sin_encodear",
      "app_encodeado"
    ]
  ];

  AUTO_GENERATED_LINKS
    .forEach(
      item => {
        filas.push([
          item.source,
          item.medium,
          item.campaign,
          item.content,
          item.term,
          item.detail,
          item.finalUrl,
          item.finalUrlSinEncodear,
          item.webParametrizada,
          item.webEncodeada,
          item.appParametrizada,
          item.appEncodeada
        ]);
      }
    );

  const csv =
    filas
      .map(
        fila =>
          fila
            .map(
              escaparCsv
            )
            .join(",")
      )
      .join(
        "\r\n"
      );

  const blob =
    new Blob(
      [
        "\uFEFF" +
        csv
      ],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const enlace =
    document.createElement(
      "a"
    );

  const nombreCampana =
    limpiarValor(
      $("utmCampaign")
        .value
    )
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      ) ||
    "campana";

  enlace.href =
    url;

  enlace.download =
    "links-" +
    nombreCampana +
    ".csv";

  document.body.appendChild(
    enlace
  );

  enlace.click();

  enlace.remove();

  URL.revokeObjectURL(
    url
  );
}

function resetAutogenerador() {
  AUTO_GENERATED_LINKS =
    [];

  if ($("autoGeneratorPanel")) {
    $("autoGeneratorPanel")
      .classList
      .add(
        "hidden"
      );
  }

  if ($("autoResultsCard")) {
    $("autoResultsCard")
      .classList
      .add(
        "hidden"
      );
  }

  if ($("autoResultsBody")) {
    $("autoResultsBody")
      .innerHTML =
        "";
  }

  if ($("autoResultsEmpty")) {
    $("autoResultsEmpty")
      .classList
      .remove(
        "hidden"
      );
  }

  if ($("autoResultsContent")) {
    $("autoResultsContent")
      .classList
      .add(
        "hidden"
      );
  }

  limpiarFuentesAuto();
}


/* =========================================================
   PROBADOR
========================================================= */

function construirLinkPrueba(
  webBase,
  appBase
) {
  const webLimpia =
    establecerParametros(
      webBase,
      {},
      [
        "embeddedURL"
      ]
    );

  if (!appBase) {
    return webLimpia;
  }

  const separador =
    webLimpia.includes(
      "?"
    )
      ? "&"
      : "?";

  return (
    webLimpia +
    separador +
    "embeddedURL=" +
    encodeURIComponent(
      appBase
    )
  );
}

function cargarProbadorRutas(
  web,
  app,
  nombre = "Destino actual"
) {
  if ($("testProductName")) {
    $("testProductName")
      .textContent =
        "Probando: " +
        nombre;
  }

  if ($("testWebLink")) {
    $("testWebLink").value =
      web || "";
  }

  if ($("testAppLink")) {
    $("testAppLink").value =
      app || "";
  }

  actualizarEnlaceApp();

  if ($("testFinalLink")) {
    $("testFinalLink").value =
      web
        ? construirLinkPrueba(
            web,
            app
          )
        : "";
  }

  if ($("testConsole")) {
    $("testConsole")
      .innerHTML =
        "<strong>Diagnóstico del Deeplink App</strong><br>" +
        (
          app
            ? "Deeplink cargado. Presiona <strong>Abrir Deeplink App</strong> para probarlo."
            : "Este destino no tiene Deeplink App configurado."
        );
  }
}

function probarLinkExistente() {
  const link =
    limpiarValor(
      $("testFinalLink")
        .value
    );

  if (!link) {
    alert(
      "Selecciona un producto o pega un link combinado."
    );

    return;
  }

  if (
    !esUrlWebValida(
      link
    )
  ) {
    alert(
      "El link combinado debe comenzar con http:// o https://."
    );

    return;
  }

  window.location.href =
    link;
}

function probarLinkWeb() {
  const link =
    limpiarValor(
      $("testWebLink")
        .value
    );

  if (!link) {
    alert(
      "Selecciona un producto o pega una URL Web."
    );

    return;
  }

  if (
    !esUrlWebValida(
      link
    )
  ) {
    alert(
      "La URL Web debe comenzar con http:// o https://."
    );

    return;
  }

  window.location.href =
    link;
}

function actualizarEnlaceApp() {
  const enlace =
    $("testAppAnchor");

  if (!enlace) {
    return;
  }

  const link =
    limpiarValor(
      $("testAppLink")
        .value
    );

  if (
    link.startsWith(
      "scotiabankpe://"
    )
  ) {
    enlace.href =
      link;

    enlace.setAttribute(
      "aria-disabled",
      "false"
    );

  } else {
    enlace.href =
      "#";

    enlace.setAttribute(
      "aria-disabled",
      "true"
    );
  }
}

function registrarIntentoDeeplink() {
  const link =
    limpiarValor(
      $("testAppLink")
        .value
    );

  const consola =
    $("testConsole");

  const enlace =
    $("testAppAnchor");

  if (!link) {
    alert(
      "Selecciona un producto o pega un Deeplink App."
    );

    enlace.href =
      "#";

    return false;
  }

  if (
    !link.startsWith(
      "scotiabankpe://"
    )
  ) {
    alert(
      "El Deeplink App debe comenzar con scotiabankpe:///."
    );

    enlace.href =
      "#";

    return false;
  }

  enlace.href =
    link;

  let paginaOculta =
    false;

  consola.innerHTML =
    "<strong>Diagnóstico del Deeplink App</strong><br><br>" +
    '<span class="info">Estado:</span> intentando abrir el esquema...';

  const detectarCambio =
    () => {
      if (
        document.hidden &&
        !paginaOculta
      ) {
        paginaOculta =
          true;

        consola.innerHTML +=
          '<br><br><span class="ok">' +
          "✓ La página pasó a segundo plano. " +
          "Es una señal compatible con que el sistema haya entregado el deeplink." +
          "</span>";
      }
    };

  document.addEventListener(
    "visibilitychange",
    detectarCambio
  );

  setTimeout(
    () => {
      document.removeEventListener(
        "visibilitychange",
        detectarCambio
      );

      if (!paginaOculta) {
        consola.innerHTML +=
          '<br><br><span class="warn">' +
          "⚠ La página siguió visible. " +
          "El navegador o el sistema no abrió una aplicación con este esquema en esta prueba." +
          "</span>";
      }
    },
    1800
  );

  return true;
}

async function copiarDeeplinkApp() {
  const link =
    limpiarValor(
      $("testAppLink")
        .value
    );

  if (!link) {
    alert(
      "No hay Deeplink App para copiar."
    );

    return;
  }

  const copiado = await escribirPortapapeles(link);
  alert(copiado ? "Deeplink App copiado correctamente." :
    "No se pudo copiar automáticamente. Selecciona y copia el deeplink manualmente.");
}

function limpiarProbador() {
  if ($("testProductName")) {
    $("testProductName")
      .textContent =
        "Selecciona un producto para comenzar.";
  }

  if ($("testFinalLink")) {
    $("testFinalLink").value =
      "";
  }

  if ($("testWebLink")) {
    $("testWebLink").value =
      "";
  }

  if ($("testAppLink")) {
    $("testAppLink").value =
      "";
  }

  actualizarEnlaceApp();

  if ($("testConsole")) {
    $("testConsole")
      .innerHTML =
        "<strong>Diagnóstico del Deeplink App</strong><br>" +
        "Selecciona un producto y presiona <strong>Abrir Deeplink App</strong>.";
  }
}


/* =========================================================
   ANALIZADOR DE LINKS
========================================================= */

function obtenerQueryCruda(url) {
  const limpia =
    limpiarValor(
      url
    );

  const interrogacion =
    limpia.indexOf("?");

  if (
    interrogacion === -1
  ) {
    return "";
  }

  const hash =
    limpia.indexOf(
      "#",
      interrogacion
    );

  return hash === -1
    ? limpia.substring(
        interrogacion + 1
      )
    : limpia.substring(
        interrogacion + 1,
        hash
      );
}

function obtenerParesParametros(url) {
  const query =
    obtenerQueryCruda(
      url
    );

  if (!query) {
    return [];
  }

  return query
    .split("&")
    .filter(Boolean)
    .map(
      par => {
        const index =
          par.indexOf("=");

        const keyRaw =
          index === -1
            ? par
            : par.substring(
                0,
                index
              );

        const valueRaw =
          index === -1
            ? ""
            : par.substring(
                index + 1
              );

        return {
          keyRaw,
          valueRaw,

          key:
            decodificarSeguro(
              keyRaw
            ),

          value:
            decodificarSeguro(
              valueRaw
            )
        };
      }
    );
}

function obtenerParametroAnalizador(
  pares,
  nombre
) {
  const encontrado =
    pares.find(
      item =>
        item.key === nombre
    );

  return encontrado
    ? encontrado.value
    : "";
}

function obtenerParametroCrudoAnalizador(
  pares,
  nombre
) {
  const encontrado =
    pares.find(
      item =>
        item.key === nombre
    );

  return encontrado
    ? encontrado.valueRaw
    : "";
}

function obtenerBaseAnalizador(valor) {
  const limpia =
    limpiarValor(
      valor
    );

  if (!limpia) {
    return "";
  }

  const queryIndex =
    limpia.indexOf("?");

  const hashIndex =
    limpia.indexOf("#");

  let corte =
    limpia.length;

  if (
    queryIndex !== -1
  ) {
    corte =
      Math.min(
        corte,
        queryIndex
      );
  }

  if (
    hashIndex !== -1
  ) {
    corte =
      Math.min(
        corte,
        hashIndex
      );
  }

  return limpia.substring(
    0,
    corte
  );
}

function obtenerDominioAnalizador(valor) {
  const limpia =
    limpiarValor(
      valor
    );

  if (!limpia) {
    return "-";
  }

  if (
    limpia.startsWith(
      "scotiabankpe://"
    )
  ) {
    return "scotiabankpe://";
  }

  try {
    const url =
      new URL(
        limpia
      );

    return url.hostname ||
      "-";

  } catch {
    return "-";
  }
}

function detectarTipoLinkAnalizador(
  valor,
  pares
) {
  const limpia =
    limpiarValor(
      valor
    );

  const embedded =
    obtenerParametroAnalizador(
      pares,
      "embeddedURL"
    );

  if (
    /^https?:\/\//i.test(
      limpia
    ) &&
    embedded
  ) {
    return "Link combinado Web + App";
  }

  if (
    /^https?:\/\//i.test(
      limpia
    )
  ) {
    return "URL Web";
  }

  if (
    /^scotiabankpe:\/\//i.test(
      limpia
    )
  ) {
    return "Deeplink App";
  }

  return "Formato no reconocido";
}

function asignarTextoAnalizador(
  id,
  valor,
  fallback = "-"
) {
  const elemento =
    $(id);

  if (!elemento) {
    return;
  }

  elemento.textContent =
    limpiarValor(
      valor
    ) ||
    fallback;
}

function renderOtrosParametrosAnalizador(
  pares,
  paresApp = []
) {
  const contenedor =
    $("analyzerOtherParams");

  if (!contenedor) {
    return;
  }

  const ignorados =
    new Set([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "source",
      "detail",
      "embeddedURL",
      "redirectTo",
      "redirecto"
    ]);

  const bloques =
    [];

  pares
    .filter(
      item =>
        !ignorados.has(
          item.key
        )
    )
    .forEach(
      item => {
        bloques.push(
          "Web · " +
          item.key +
          " = " +
          (
            item.value ||
            "(vacío)"
          )
        );
      }
    );

  paresApp
    .filter(
      item =>
        !ignorados.has(
          item.key
        )
    )
    .forEach(
      item => {
        bloques.push(
          "App · " +
          item.key +
          " = " +
          (
            item.value ||
            "(vacío)"
          )
        );
      }
    );

  contenedor.innerHTML =
    "";

  if (
    !bloques.length
  ) {
    contenedor.textContent =
      "No se encontraron parámetros adicionales.";

    return;
  }

  bloques.forEach(
    texto => {
      const fila =
        document.createElement(
          "div"
        );

      fila.textContent =
        texto;

      contenedor.appendChild(
        fila
      );
    }
  );
}

function analizarLink() {
  const input =
    $("linkAnalyzerInput");

  const valor =
    limpiarValor(
      input
        ? input.value
        : ""
    );

  if (!valor) {
    alert(
      "Pega un link para analizar."
    );

    return;
  }

  const pares =
    obtenerParesParametros(
      valor
    );

  const tipo =
    detectarTipoLinkAnalizador(
      valor,
      pares
    );

  const esAppDirecta =
    /^scotiabankpe:\/\//i.test(
      valor
    );

  const embeddedCrudo =
    obtenerParametroCrudoAnalizador(
      pares,
      "embeddedURL"
    );

  const embeddedDecodificado =
    embeddedCrudo
      ? decodificarSeguro(
          embeddedCrudo
        )
      : "";

  const appAnalizada =
    embeddedDecodificado ||
    (
      esAppDirecta
        ? valor
        : ""
    );

  const paresApp =
    appAnalizada
      ? obtenerParesParametros(
          appAnalizada
        )
      : [];

  const redirectTo =
    obtenerParametroAnalizador(
      pares,
      "redirectTo"
    ) ||
    obtenerParametroAnalizador(
      pares,
      "redirecto"
    );

  asignarTextoAnalizador(
    "analyzerDetectedType",
    tipo
  );

  asignarTextoAnalizador(
    "analyzerDomain",
    obtenerDominioAnalizador(
      valor
    )
  );

  asignarTextoAnalizador(
    "analyzerUtmSource",
    obtenerParametroAnalizador(
      pares,
      "utm_source"
    )
  );

  asignarTextoAnalizador(
    "analyzerUtmMedium",
    obtenerParametroAnalizador(
      pares,
      "utm_medium"
    )
  );

  asignarTextoAnalizador(
    "analyzerUtmCampaign",
    obtenerParametroAnalizador(
      pares,
      "utm_campaign"
    )
  );

  asignarTextoAnalizador("analyzerUtmContent", obtenerParametroAnalizador(pares, "utm_content"));
  asignarTextoAnalizador("analyzerUtmTerm", obtenerParametroAnalizador(pares, "utm_term"));

  asignarTextoAnalizador(
    "analyzerSource",
    obtenerParametroAnalizador(
      pares,
      "source"
    )
  );

  asignarTextoAnalizador(
    "analyzerDetail",
    obtenerParametroAnalizador(
      pares,
      "detail"
    )
  );

  asignarTextoAnalizador(
    "analyzerWebBase",
    esAppDirecta
      ? ""
      : obtenerBaseAnalizador(
          valor
        )
  );

  asignarTextoAnalizador(
    "analyzerRedirectTo",
    redirectTo
  );

  asignarTextoAnalizador(
    "analyzerEmbeddedEncoded",
    embeddedCrudo
  );

  asignarTextoAnalizador(
    "analyzerEmbeddedDecoded",
    appAnalizada
  );

  asignarTextoAnalizador(
    "analyzerAppUtmSource",
    obtenerParametroAnalizador(
      paresApp,
      "utm_source"
    )
  );

  asignarTextoAnalizador(
    "analyzerAppUtmMedium",
    obtenerParametroAnalizador(
      paresApp,
      "utm_medium"
    )
  );

  asignarTextoAnalizador(
    "analyzerAppUtmCampaign",
    obtenerParametroAnalizador(
      paresApp,
      "utm_campaign"
    )
  );

  asignarTextoAnalizador("analyzerAppUtmContent", obtenerParametroAnalizador(paresApp, "utm_content"));
  asignarTextoAnalizador("analyzerAppUtmTerm", obtenerParametroAnalizador(paresApp, "utm_term"));

  asignarTextoAnalizador(
    "analyzerAppSource",
    obtenerParametroAnalizador(
      paresApp,
      "source"
    )
  );

  asignarTextoAnalizador(
    "analyzerAppDetail",
    obtenerParametroAnalizador(
      paresApp,
      "detail"
    )
  );

  renderOtrosParametrosAnalizador(
    pares,
    paresApp
  );

  if ($("linkAnalyzerEmpty")) {
    $("linkAnalyzerEmpty")
      .classList
      .add(
        "hidden"
      );
  }

  if ($("linkAnalyzerResults")) {
    $("linkAnalyzerResults")
      .classList
      .remove(
        "hidden"
      );

    $("linkAnalyzerResults")
      .scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
  }
}

function limpiarAnalizador() {
  const input =
    $("linkAnalyzerInput");

  if (input) {
    input.value =
      "";
  }

  const ids = [
    "analyzerDetectedType",
    "analyzerDomain",
    "analyzerUtmSource",
    "analyzerUtmMedium",
    "analyzerUtmCampaign",
    "analyzerUtmContent",
    "analyzerUtmTerm",
    "analyzerSource",
    "analyzerDetail",
    "analyzerWebBase",
    "analyzerRedirectTo",
    "analyzerEmbeddedEncoded",
    "analyzerEmbeddedDecoded",
    "analyzerAppUtmSource",
    "analyzerAppUtmMedium",
    "analyzerAppUtmCampaign",
    "analyzerAppUtmContent",
    "analyzerAppUtmTerm",
    "analyzerAppSource",
    "analyzerAppDetail"
  ];

  ids.forEach(
    id => {
      asignarTextoAnalizador(
        id,
        ""
      );
    }
  );

  if ($("analyzerOtherParams")) {
    $("analyzerOtherParams")
      .textContent =
        "-";
  }

  if ($("linkAnalyzerEmpty")) {
    $("linkAnalyzerEmpty")
      .classList
      .remove(
        "hidden"
      );
  }

  if ($("linkAnalyzerResults")) {
    $("linkAnalyzerResults")
      .classList
      .add(
        "hidden"
      );
  }
}


/* =========================================================
   LIMPIAR FORMULARIO
========================================================= */

function limpiarFormulario() {
  PRESET_OPENMARKET_ACTIVO = false;
  if ($("productSelect")) {
    $("productSelect").value =
      "";
  }

  if ($("webUrl")) {
    $("webUrl").value =
      "";
  }

  if ($("appUrl")) {
    $("appUrl").value =
      "";
  }

  if ($("utmSource")) {
    $("utmSource").value =
      "";
  }

  if ($("utmSourceOtro")) {
    $("utmSourceOtro").value =
      "";

    $("utmSourceOtro")
      .classList
      .add(
        "hidden"
      );
  }

  if ($("utmMedium")) {
    $("utmMedium").innerHTML =
      '<option value="">Primero selecciona una fuente...</option>';

    $("utmMedium").disabled =
      true;
  }

  if ($("utmMediumOtro")) {
    $("utmMediumOtro").value =
      "";

    $("utmMediumOtro")
      .classList
      .add(
        "hidden"
      );
  }

  if ($("utmCampaign")) {
    $("utmCampaign").value = "";
  }
  if ($("utmTerm")) $("utmTerm").value = "";
  if ($("utmContent")) $("utmContent").value = "";
  if ($("nonClientLandingUrl")) $("nonClientLandingUrl").value = "";
  if ($("guidedChannel")) $("guidedChannel").value = "";
  const objetivoWeb = document.querySelector('input[name="guidedIntent"][value="web"]');
  if (objetivoWeb) objetivoWeb.checked = true;
  if ($("internalSourceCampaign")) $("internalSourceCampaign").checked = false;
  document.querySelector('input[name="measurementMode"][value="campana"]').checked = true;
  document.querySelector('input[name="linkDestinationMode"][value="web"]').checked = true;

  if ($("sourceInternal")) {
    $("sourceInternal").value = SOURCE_CAMPAIGN;
    $("sourceInternal").dataset.sourceEditado = "false";
  }

  if ($("detail")) {
    $("detail").value =
      "";
  }

  productoSeleccionado =
    null;

  limpiarCamposConstructor(
    true
  );

  limpiarProbador();

  ocultarResultado();

  resetAutogenerador();

  renderCatalog();
  actualizarModoMedicion();
  actualizarModoDestino();
  actualizarConsejoCanal();
  irAlPaso(1, true);
}


/* =========================================================
   INICIO
========================================================= */

async function iniciar() {
  if ($("sourceInternal")) {
    $("sourceInternal").value = SOURCE_CAMPAIGN;
    $("sourceInternal").dataset.sourceEditado = "false";
  }

  cambiarModulo(
    "generador",
    false
  );

  limpiarAnalizador();

  cargarSelectCategoriasWebview();

  cargarSelectCategoriasNativo();

  cambiarTipoDestino();

  cambiarModoWebNativo();

  renderCatalog();
  actualizarModoMedicion();
  actualizarModoDestino();
  actualizarConsejoCanal();

  await cargarConfiguracion();
  actualizarVistaPasos();
  ["webUrl","appUrl","nonClientLandingUrl","utmCampaign","utmTerm","utmContent","utmSourceOtro","utmMediumOtro","sourceInternal","detail"].forEach(id => {
    const input = $(id);
    if (input) input.addEventListener("input", ocultarResultado);
  });
}

iniciar();
