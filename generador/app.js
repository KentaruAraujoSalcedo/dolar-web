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
  const texto =
    String(valor ?? "");

  if (!texto) {
    return false;
  }

  try {
    await navigator
      .clipboard
      .writeText(texto);

    return true;

  } catch {
    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      texto;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

    return true;
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
  if ($("productSelect")) {
    $("productSelect").value =
      id;
  }

  seleccionarProducto(id);

  cambiarModulo(
    "generador"
  );
}


/* =========================================================
   CATÁLOGO PRINCIPAL
========================================================= */

function renderCatalog() {
  const catalog =
    $("catalog");

  if (!catalog) {
    return;
  }

  const searchEl =
    $("catalogSearch");

  const search =
    limpiarValor(
      searchEl
        ? searchEl.value
        : ""
    )
      .toLowerCase();

  const contador =
    $("catalogVisibleCount");

  if (
    !PRODUCTOS.length
  ) {
    catalog.innerHTML =
      '<div class="empty">El catálogo se cargará desde productos.json.</div>';

    if (contador) {
      contador.textContent =
        "0 destinos";
    }

    return;
  }

  const filtrados =
    PRODUCTOS.filter(
      productoBase => {
        const producto =
          resolverProducto(
            productoBase
          );

        const texto =
          (
            producto.nombre +
            " " +
            producto.id +
            " " +
            producto.web +
            " " +
            producto.app +
            " " +
            producto.tipo
          )
            .toLowerCase();

        return texto.includes(
          search
        );
      }
    );

  if (contador) {
    contador.textContent =
      search
        ? filtrados.length +
          " de " +
          PRODUCTOS.length
        : PRODUCTOS.length +
          " destinos";
  }

  catalog.innerHTML =
    "";

  if (
    !filtrados.length
  ) {
    catalog.innerHTML =
      '<div class="empty">No se encontraron productos.</div>';

    return;
  }

  filtrados.forEach(
    productoBase => {
      const producto =
        resolverProducto(
          productoBase
        );

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "product";

      if (
        productoSeleccionado &&
        productoSeleccionado.id ===
          producto.id
      ) {
        div
          .classList
          .add(
            "active"
          );
      }

      div.onclick =
        () =>
          seleccionarDesdeCatalogo(
            producto.id
          );

      const nombre =
        document.createElement(
          "div"
        );

      nombre.className =
        "product-name";

      nombre.textContent =
        producto.nombre;


      const web =
        document.createElement(
          "div"
        );

      web.className =
        "product-path";

      const webStrong =
        document.createElement(
          "strong"
        );

      webStrong.textContent =
        "Web:";

      web.append(
        webStrong,
        document.createElement(
          "br"
        ),
        document.createTextNode(
          producto.web ||
          "Pendiente de configurar"
        )
      );


      const app =
        document.createElement(
          "div"
        );

      app.className =
        "product-path";

      const appStrong =
        document.createElement(
          "strong"
        );

      appStrong.textContent =
        "App:";

      app.append(
        appStrong,
        document.createElement(
          "br"
        ),
        document.createTextNode(
          producto.app ||
          "Pendiente de configurar"
        )
      );


      const badge =
        document.createElement(
          "span"
        );

      badge.className =
        "badge";

      badge.textContent =
        producto.tipo === "webview"
          ? "WebView"
          : "Nativo";


      div.append(
        nombre,
        web,
        app,
        badge
      );

      catalog.appendChild(
        div
      );
    }
  );
}


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

    return;
  }

  if (
    !esUrlWebValida(
      rutas.web
    )
  ) {
    alert(
      "La URL Web generada no parece válida."
    );

    return;
  }

  if (!rutas.app) {
    alert(
      "Selecciona o completa el destino App."
    );

    return;
  }

  if (
    !esDeeplinkValido(
      rutas.app
    )
  ) {
    alert(
      "El Deeplink App generado no parece válido."
    );

    return;
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
   CONSTRUCCIÓN DE CAMPAÑA
========================================================= */

function construirVariantesCampana(
  webBase,
  appBase,
  utmSource,
  utmMedium,
  utmCampaign,
  detail = ""
) {
  const parametrosCampana = {
    utm_source:
      normalizarTaxonomia(
        utmSource
      ),

    utm_medium:
      normalizarTaxonomia(
        utmMedium
      ),

    utm_campaign:
      limpiarValor(
        utmCampaign
      ),

    source:
      SOURCE_CAMPAIGN
  };

  if (
    limpiarValor(
      detail
    )
  ) {
    parametrosCampana.detail =
      limpiarValor(
        detail
      );
  }

  const webParametrizada =
    establecerParametros(
      webBase,
      parametrosCampana,
      [
        "embeddedURL"
      ]
    );

  const appParametrizada =
    establecerParametros(
      appBase,
      parametrosCampana
    );

  const separador =
    webParametrizada.includes(
      "?"
    )
      ? "&"
      : "?";

  const appEncodeada =
    encodeURIComponent(
      appParametrizada
    );

  const webEncodeada =
    encodeURIComponent(
      webParametrizada
    );

  const finalUrl =
    webParametrizada +
    separador +
    "embeddedURL=" +
    appEncodeada;

  const finalUrlSinEncodear =
    webParametrizada +
    separador +
    "embeddedURL=" +
    appParametrizada;

  return {
    source:
      normalizarTaxonomia(
        utmSource
      ),

    medium:
      normalizarTaxonomia(
        utmMedium
      ),

    campaign:
      limpiarValor(
        utmCampaign
      ),

    detail:
      limpiarValor(
        detail
      ),

    finalUrl,
    finalUrlSinEncodear,
    webParametrizada,
    webEncodeada,
    appParametrizada,
    appEncodeada
  };
}


/* =========================================================
   GENERACIÓN INDIVIDUAL
========================================================= */

function generarLink() {
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

  const sourceSeleccionado =
    $("utmSource")
      .value;

  const mediumSeleccionado =
    $("utmMedium")
      .value;

  const utmSource =
    normalizarTaxonomia(
      sourceSeleccionado === "__otro__"
        ? $("utmSourceOtro")
            .value
        : sourceSeleccionado
    );

  const utmMedium =
    normalizarTaxonomia(
      mediumSeleccionado === "__otro__"
        ? $("utmMediumOtro")
            .value
        : mediumSeleccionado
    );

  const utmCampaign =
    limpiarValor(
      $("utmCampaign")
        .value
    );

  const detail =
    limpiarValor(
      $("detail")
        .value
    );

  if (
    !webBase ||
    !esUrlWebValida(
      webBase
    )
  ) {
    alert(
      "Completa una URL Web válida."
    );

    return;
  }

  if (
    !appBase ||
    !esDeeplinkValido(
      appBase
    )
  ) {
    alert(
      "Completa un Deeplink App válido."
    );

    return;
  }

  if (
    !utmSource ||
    !utmMedium ||
    !utmCampaign
  ) {
    alert(
      "Completa utm_source, utm_medium y utm_campaign."
    );

    return;
  }

  const resultado =
    construirVariantesCampana(
      webBase,
      appBase,
      utmSource,
      utmMedium,
      utmCampaign,
      detail
    );

  $("finalUrl")
    .textContent =
      resultado.finalUrl;

  $("finalEncodedPreview")
    .textContent =
      resultado.finalUrl;

  $("finalDecodedPreview")
    .textContent =
      resultado.finalUrlSinEncodear;

  $("webPreview")
    .textContent =
      resultado.webParametrizada;

  $("webEncodedPreview")
    .textContent =
      resultado.webEncodeada;

  $("appPreview")
    .textContent =
      resultado.appParametrizada;

  $("appEncodedPreview")
    .textContent =
      resultado.appEncodeada;

  const modeNote =
    $("generationModeNote");

  const rutasActuales =
    obtenerRutasDesdeConstructor();

  if (modeNote) {
    if (
      rutasActuales.tipo === "native" &&
      rutasActuales.modoWeb === "landing"
    ) {
      modeNote.className =
        "mode-note experimental";

      modeNote.innerHTML =
        "<strong>Landing directa / modo de prueba</strong><br>" +
        "El link fue generado con embeddedURL, pero esta landing no necesariamente abrirá la App por sí sola.";

    } else if (
      rutasActuales.tipo === "native" &&
      rutasActuales.modoWeb === "login"
    ) {
      modeNote.className =
        "mode-note verified";

      modeNote.innerHTML =
        "<strong>Wrapper /login</strong><br>" +
        "Este modo usa la estructura que procesa embeddedURL.";

    } else {
      modeNote.className =
        "mode-note verified";

      modeNote.innerHTML =
        "<strong>WebView</strong><br>" +
        "Se usa /login como wrapper y webView?path=... como Deeplink App.";
    }
  }

  $("resultBox")
    .classList
    .add(
      "visible"
    );

  $("emptyResult")
    .classList
    .add(
      "hidden"
    );
}

function ocultarResultado() {
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

  await escribirPortapapeles(
    valor
  );

  alert(
    nombre +
    " copiado correctamente."
  );
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

  await escribirPortapapeles(
    link
  );

  alert(
    "Link copiado correctamente."
  );
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

  const detail =
    limpiarValor(
      $("detail")
        .value
    );

  if (
    !webBase ||
    !esUrlWebValida(
      webBase
    )
  ) {
    alert(
      "Completa una URL Web válida antes de autogenerar."
    );

    return null;
  }

  if (
    !appBase ||
    !esDeeplinkValido(
      appBase
    )
  ) {
    alert(
      "Completa un Deeplink App válido antes de autogenerar."
    );

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
    detail
  };
}

function autogenerarLinks() {
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
              base.detail
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

  await escribirPortapapeles(
    item.finalUrl
  );

  alert(
    "Link copiado: " +
    item.source +
    " / " +
    item.medium
  );
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

  await escribirPortapapeles(
    texto
  );

  alert(
    AUTO_GENERATED_LINKS.length +
    " links copiados correctamente."
  );
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

  await escribirPortapapeles(
    link
  );

  alert(
    "Deeplink App copiado correctamente."
  );
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
    "analyzerSource",
    "analyzerDetail",
    "analyzerWebBase",
    "analyzerRedirectTo",
    "analyzerEmbeddedEncoded",
    "analyzerEmbeddedDecoded",
    "analyzerAppUtmSource",
    "analyzerAppUtmMedium",
    "analyzerAppUtmCampaign",
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
    $("utmCampaign").value =
      "";
  }

  if ($("sourceInternal")) {
    $("sourceInternal").value =
      SOURCE_CAMPAIGN;
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
}


/* =========================================================
   INICIO
========================================================= */

async function iniciar() {
  if ($("sourceInternal")) {
    $("sourceInternal").value =
      SOURCE_CAMPAIGN;
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

  await cargarConfiguracion();
}

iniciar();
