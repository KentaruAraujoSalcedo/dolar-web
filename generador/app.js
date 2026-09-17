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

function getTipoDestino() {
  return document.querySelector('input[name="destinationType"]:checked').value;
}

function setTipoDestino(tipo) {
  const radio = document.querySelector(
    `input[name="destinationType"][value="${tipo}"]`
  );

  if (radio) {
    radio.checked = true;
    cambiarTipoDestino();
  }
}

function cambiarTipoDestino() {
  const tipo = getTipoDestino();

  document
    .getElementById("webviewPanel")
    .classList.toggle("hidden", tipo !== "webview");

  document
    .getElementById("nativePanel")
    .classList.toggle("hidden", tipo !== "native");

  previsualizarRutasGeneradas();
}


/* =========================================================
   WEBVIEW
========================================================= */

function contarPathsWebview() {
  let total = 0;

  Object.values(WEBVIEW_CATALOG || {}).forEach(grupos => {
    if (!Array.isArray(grupos)) return;

    grupos.forEach(grupo => {
      if (Array.isArray(grupo.paths)) {
        total += grupo.paths.length;
      }
    });
  });

  return total;
}

function cargarSelectCategoriasWebview() {
  const categoria = document.getElementById("webviewCategory");
  const grupo = document.getElementById("webviewGroup");
  const pantalla = document.getElementById("webviewScreen");

  if (!categoria || !grupo || !pantalla) return;

  categoria.innerHTML =
    '<option value="">Seleccionar tipo...</option>';

  Object.keys(WEBVIEW_CATALOG || {}).forEach(nombre => {
    const option = document.createElement("option");

    option.value = nombre;
    option.textContent = nombre;

    categoria.appendChild(option);
  });

  const manual = document.createElement("option");

  manual.value = "__manual__";
  manual.textContent = "Otro / escribir ruta manualmente";

  categoria.appendChild(manual);

  grupo.innerHTML =
    '<option value="">Seleccionar grupo...</option>';

  grupo.disabled = true;

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  pantalla.disabled = true;

  document
    .getElementById("webviewManualBlock")
    .classList.add("hidden");

  document.getElementById("webviewSelectedPathBox").innerHTML =
    '<strong>Ruta seleccionada:</strong><br>Selecciona Tipo → Grupo → Pantalla.';
}

function cargarGruposWebview() {
  const categoria =
    document.getElementById("webviewCategory").value;

  const grupo =
    document.getElementById("webviewGroup");

  const pantalla =
    document.getElementById("webviewScreen");

  const manualBlock =
    document.getElementById("webviewManualBlock");

  grupo.innerHTML =
    '<option value="">Seleccionar grupo...</option>';

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  pantalla.disabled = true;

  if (categoria === "__manual__") {
    grupo.disabled = true;

    manualBlock.classList.remove("hidden");

    document.getElementById("webviewPath").value = "";

    document.getElementById("webviewSelectedPathBox").innerHTML =
      '<strong>Ruta seleccionada:</strong><br>Modo manual.';

    previsualizarRutasGeneradas();

    setTimeout(() => {
      document.getElementById("webviewPath").focus();
    }, 0);

    return;
  }

  manualBlock.classList.add("hidden");

  document.getElementById("webviewPath").value = "";

  const grupos =
    WEBVIEW_CATALOG[categoria];

  if (!categoria || !Array.isArray(grupos)) {
    grupo.disabled = true;

    document.getElementById("webviewSelectedPathBox").innerHTML =
      '<strong>Ruta seleccionada:</strong><br>Selecciona Tipo → Grupo → Pantalla.';

    previsualizarRutasGeneradas();

    return;
  }

  grupos.forEach((item, index) => {
    const option =
      document.createElement("option");

    option.value =
      String(index);

    option.textContent =
      item.grupo +
      (item.cantidad
        ? ` (${item.cantidad})`
        : "");

    grupo.appendChild(option);
  });

  grupo.disabled = false;

  document.getElementById("webviewSelectedPathBox").innerHTML =
    '<strong>Ruta seleccionada:</strong><br>Selecciona un grupo.';

  previsualizarRutasGeneradas();
}

function cargarPantallasWebview() {
  const categoria =
    document.getElementById("webviewCategory").value;

  const grupoIndex =
    document.getElementById("webviewGroup").value;

  const pantalla =
    document.getElementById("webviewScreen");

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  document.getElementById("webviewPath").value = "";

  document
    .getElementById("webviewManualBlock")
    .classList.add("hidden");

  if (!categoria || grupoIndex === "") {
    pantalla.disabled = true;

    document.getElementById("webviewSelectedPathBox").innerHTML =
      '<strong>Ruta seleccionada:</strong><br>Selecciona un grupo.';

    previsualizarRutasGeneradas();

    return;
  }

  const grupos =
    WEBVIEW_CATALOG[categoria] || [];

  const grupo =
    grupos[Number(grupoIndex)];

  if (!grupo || !Array.isArray(grupo.paths)) {
    pantalla.disabled = true;

    previsualizarRutasGeneradas();

    return;
  }

  grupo.paths.forEach(path => {
    const option =
      document.createElement("option");

    option.value = path;
    option.textContent = path;

    pantalla.appendChild(option);
  });

  const manual =
    document.createElement("option");

  manual.value =
    "__manual__";

  manual.textContent =
    "Otro / escribir ruta manualmente";

  pantalla.appendChild(manual);

  pantalla.disabled = false;

  document.getElementById("webviewSelectedPathBox").innerHTML =
    `<strong>${grupo.grupo}</strong><br>Selecciona la pantalla exacta.`;

  previsualizarRutasGeneradas();
}

function seleccionarPantallaWebview() {
  const pantalla =
    document.getElementById("webviewScreen").value;

  const manualBlock =
    document.getElementById("webviewManualBlock");

  const pathInput =
    document.getElementById("webviewPath");

  if (pantalla === "__manual__") {
    pathInput.value = "";

    manualBlock.classList.remove("hidden");

    document.getElementById("webviewSelectedPathBox").innerHTML =
      '<strong>Ruta seleccionada:</strong><br>Modo manual.';

    previsualizarRutasGeneradas();

    setTimeout(() => {
      pathInput.focus();
    }, 0);

    return;
  }

  manualBlock.classList.add("hidden");

  pathInput.value =
    pantalla || "";

  document.getElementById("webviewSelectedPathBox").innerHTML =
    pantalla
      ? `<strong>Ruta seleccionada:</strong><br>${pantalla}`
      : '<strong>Ruta seleccionada:</strong><br>Selecciona una pantalla.';

  previsualizarRutasGeneradas();
}

function actualizarRutaManualWebview() {
  const ruta =
    limpiarValor(
      document.getElementById("webviewPath").value
    );

  document.getElementById("webviewSelectedPathBox").innerHTML =
    ruta
      ? `<strong>Ruta manual:</strong><br>${ruta}`
      : '<strong>Ruta seleccionada:</strong><br>Escribe una ruta WebView.';

  previsualizarRutasGeneradas();
}

function buscarRutaEnCatalogoWebview(ruta) {
  const buscada =
    normalizarRuta(ruta);

  if (!buscada) return null;

  for (
    const [categoria, grupos]
    of Object.entries(WEBVIEW_CATALOG || {})
  ) {
    if (!Array.isArray(grupos)) continue;

    for (
      let i = 0;
      i < grupos.length;
      i++
    ) {
      const grupo =
        grupos[i];

      if (
        Array.isArray(grupo.paths) &&
        grupo.paths.includes(buscada)
      ) {
        return {
          categoria,
          grupoIndex: i,
          grupo: grupo.grupo,
          path: buscada
        };
      }
    }
  }

  return null;
}

function seleccionarRutaWebviewEnCatalogo(ruta) {
  const buscada =
    normalizarRuta(ruta);

  const encontrada =
    buscarRutaEnCatalogoWebview(buscada);

  const categoriaSelect =
    document.getElementById("webviewCategory");

  const grupoSelect =
    document.getElementById("webviewGroup");

  const pantallaSelect =
    document.getElementById("webviewScreen");

  const pathInput =
    document.getElementById("webviewPath");

  if (encontrada) {
    categoriaSelect.value =
      encontrada.categoria;

    cargarGruposWebview();

    grupoSelect.value =
      String(encontrada.grupoIndex);

    cargarPantallasWebview();

    pantallaSelect.value =
      encontrada.path;

    seleccionarPantallaWebview();

    return true;
  }

  categoriaSelect.value =
    "__manual__";

  cargarGruposWebview();

  pathInput.value =
    buscada;

  actualizarRutaManualWebview();

  return false;
}


/* =========================================================
   NATIVO
========================================================= */

function contarPantallasNativo() {
  let total = 0;

  Object.values(NATIVE_CATALOG || {}).forEach(grupos => {
    if (!Array.isArray(grupos)) return;

    grupos.forEach(grupo => {
      if (Array.isArray(grupo.pantallas)) {
        total += grupo.pantallas.length;
      }
    });
  });

  return total;
}

function construirCatalogoNativoLegacy(items) {
  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return {};
  }

  return {
    "Funcionalidades": [
      {
        grupo:
          "Todas las funcionalidades nativas",

        cantidad:
          items.length,

        pantallas:
          items
            .map(item => ({
              nombre:
                item.nombre ||
                item.path ||
                "Funcionalidad",

              path:
                item.path || ""
            }))
            .filter(item => item.path)
      }
    ]
  };
}

function cargarSelectCategoriasNativo() {
  const categoria =
    document.getElementById("nativeCategory");

  const grupo =
    document.getElementById("nativeGroup");

  const pantalla =
    document.getElementById("nativeScreen");

  const manualBlock =
    document.getElementById("nativeManualBlock");

  const pathInput =
    document.getElementById("nativeAppDestination");

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

  Object.keys(NATIVE_CATALOG || {}).forEach(nombre => {
    const option =
      document.createElement("option");

    option.value =
      nombre;

    option.textContent =
      nombre;

    categoria.appendChild(option);
  });

  const manual =
    document.createElement("option");

  manual.value =
    "__manual__";

  manual.textContent =
    "Otro / escribir deeplink manualmente";

  categoria.appendChild(manual);

  grupo.innerHTML =
    '<option value="">Seleccionar grupo...</option>';

  grupo.disabled = true;

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  pantalla.disabled = true;

  manualBlock.classList.add("hidden");

  pathInput.value = "";

  document.getElementById("nativeSelectedPathBox").innerHTML =
    '<strong>Deeplink seleccionado:</strong><br>Selecciona Tipo → Grupo → Pantalla.';
}

function cargarGruposNativo() {
  const categoria =
    document.getElementById("nativeCategory").value;

  const grupo =
    document.getElementById("nativeGroup");

  const pantalla =
    document.getElementById("nativeScreen");

  const manualBlock =
    document.getElementById("nativeManualBlock");

  const pathInput =
    document.getElementById("nativeAppDestination");

  grupo.innerHTML =
    '<option value="">Seleccionar grupo...</option>';

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  pantalla.disabled =
    true;

  pathInput.value =
    "";

  if (categoria === "__manual__") {
    grupo.disabled =
      true;

    manualBlock.classList.remove("hidden");

    document.getElementById("nativeSelectedPathBox").innerHTML =
      '<strong>Deeplink seleccionado:</strong><br>Modo manual.';

    previsualizarRutasGeneradas();

    setTimeout(() => {
      pathInput.focus();
    }, 0);

    return;
  }

  manualBlock.classList.add("hidden");

  const grupos =
    NATIVE_CATALOG[categoria];

  if (
    !categoria ||
    !Array.isArray(grupos)
  ) {
    grupo.disabled =
      true;

    document.getElementById("nativeSelectedPathBox").innerHTML =
      '<strong>Deeplink seleccionado:</strong><br>Selecciona Tipo → Grupo → Pantalla.';

    previsualizarRutasGeneradas();

    return;
  }

  grupos.forEach((item, index) => {
    const option =
      document.createElement("option");

    option.value =
      String(index);

    option.textContent =
      item.grupo +
      (
        item.cantidad
          ? ` (${item.cantidad})`
          : ""
      );

    grupo.appendChild(option);
  });

  grupo.disabled =
    false;

  document.getElementById("nativeSelectedPathBox").innerHTML =
    '<strong>Deeplink seleccionado:</strong><br>Selecciona un grupo.';

  previsualizarRutasGeneradas();
}

function cargarPantallasNativo() {
  const categoria =
    document.getElementById("nativeCategory").value;

  const grupoIndex =
    document.getElementById("nativeGroup").value;

  const pantalla =
    document.getElementById("nativeScreen");

  const pathInput =
    document.getElementById("nativeAppDestination");

  pantalla.innerHTML =
    '<option value="">Seleccionar pantalla...</option>';

  pathInput.value =
    "";

  document
    .getElementById("nativeManualBlock")
    .classList.add("hidden");

  if (
    !categoria ||
    grupoIndex === ""
  ) {
    pantalla.disabled =
      true;

    document.getElementById("nativeSelectedPathBox").innerHTML =
      '<strong>Deeplink seleccionado:</strong><br>Selecciona un grupo.';

    previsualizarRutasGeneradas();

    return;
  }

  const grupos =
    NATIVE_CATALOG[categoria] || [];

  const grupo =
    grupos[Number(grupoIndex)];

  if (
    !grupo ||
    !Array.isArray(grupo.pantallas)
  ) {
    pantalla.disabled =
      true;

    previsualizarRutasGeneradas();

    return;
  }

  grupo.pantallas.forEach(item => {
    const option =
      document.createElement("option");

    option.value =
      item.path || "";

    option.textContent =
      item.path || "";

    pantalla.appendChild(option);
  });

  const manual =
    document.createElement("option");

  manual.value =
    "__manual__";

  manual.textContent =
    "Otro / escribir deeplink manualmente";

  pantalla.appendChild(manual);

  pantalla.disabled =
    false;

  document.getElementById("nativeSelectedPathBox").innerHTML =
    `<strong>${grupo.grupo}</strong><br>Selecciona la pantalla exacta.`;

  previsualizarRutasGeneradas();
}

function seleccionarPantallaNativo() {
  const pantalla =
    document.getElementById("nativeScreen").value;

  const manualBlock =
    document.getElementById("nativeManualBlock");

  const pathInput =
    document.getElementById("nativeAppDestination");

  if (
    pantalla === "__manual__"
  ) {
    pathInput.value =
      "";

    manualBlock.classList.remove("hidden");

    document.getElementById("nativeSelectedPathBox").innerHTML =
      '<strong>Deeplink seleccionado:</strong><br>Modo manual.';

    previsualizarRutasGeneradas();

    setTimeout(() => {
      pathInput.focus();
    }, 0);

    return;
  }

  manualBlock.classList.add("hidden");

  pathInput.value =
    pantalla || "";

  document.getElementById("nativeSelectedPathBox").innerHTML =
    pantalla
      ? `<strong>Deeplink seleccionado:</strong><br>${pantalla}`
      : '<strong>Deeplink seleccionado:</strong><br>Selecciona una pantalla.';

  previsualizarRutasGeneradas();
}

function actualizarRutaManualNativo() {
  const ruta =
    limpiarValor(
      document.getElementById("nativeAppDestination").value
    );

  document.getElementById("nativeSelectedPathBox").innerHTML =
    ruta
      ? `<strong>Deeplink manual:</strong><br>${ruta}`
      : '<strong>Deeplink seleccionado:</strong><br>Escribe un deeplink nativo.';

  previsualizarRutasGeneradas();
}

function buscarRutaEnCatalogoNativo(ruta) {
  const buscada =
    normalizarRuta(ruta);

  if (!buscada) return null;

  for (
    const [categoria, grupos]
    of Object.entries(NATIVE_CATALOG || {})
  ) {
    if (!Array.isArray(grupos)) {
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
        !Array.isArray(grupo.pantallas)
      ) {
        continue;
      }

      const pantallaIndex =
        grupo.pantallas.findIndex(item =>
          normalizarRuta(item.path || "") === buscada
        );

      if (
        pantallaIndex !== -1
      ) {
        return {
          categoria,
          grupoIndex: i,
          grupo: grupo.grupo,
          pantallaIndex,
          path: buscada
        };
      }
    }
  }

  return null;
}

function seleccionarRutaNativoEnCatalogo(ruta) {
  const buscada =
    normalizarRuta(ruta);

  const encontrada =
    buscarRutaEnCatalogoNativo(buscada);

  const categoriaSelect =
    document.getElementById("nativeCategory");

  const grupoSelect =
    document.getElementById("nativeGroup");

  const pantallaSelect =
    document.getElementById("nativeScreen");

  const pathInput =
    document.getElementById("nativeAppDestination");

  if (encontrada) {
    categoriaSelect.value =
      encontrada.categoria;

    cargarGruposNativo();

    grupoSelect.value =
      String(encontrada.grupoIndex);

    cargarPantallasNativo();

    pantallaSelect.value =
      encontrada.path;

    seleccionarPantallaNativo();

    return true;
  }

  categoriaSelect.value =
    "__manual__";

  cargarGruposNativo();

  pathInput.value =
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
      `input[name="nativeWebMode"][value="${modo}"]`
    );

  if (radio) {
    radio.checked = true;
  }

  cambiarModoWebNativo();
}

function cambiarModoWebNativo() {
  const modo =
    getModoWebNativo();

  document
    .getElementById("nativeLoginPanel")
    .classList.toggle(
      "hidden",
      modo !== "login"
    );

  document
    .getElementById("nativeLandingPanel")
    .classList.toggle(
      "hidden",
      modo !== "landing"
    );

  previsualizarRutasGeneradas();
}


/* =========================================================
   CONSTRUCTOR DE RUTAS
========================================================= */

function manejarRutasDiferentes() {
  const checked =
    document.getElementById("differentRoutes").checked;

  document
    .getElementById("sameRouteBlock")
    .classList.toggle("hidden", checked);

  document
    .getElementById("differentRoutesBlock")
    .classList.toggle("hidden", !checked);

  if (checked) {
    const comun =
      limpiarValor(
        document.getElementById("webviewPath").value
      );

    if (comun) {
      if (
        !document.getElementById("webviewWebPath").value
      ) {
        document.getElementById("webviewWebPath").value =
          comun;
      }

      if (
        !document.getElementById("webviewAppPath").value
      ) {
        document.getElementById("webviewAppPath").value =
          comun;
      }
    }
  }

  previsualizarRutasGeneradas();
}

function normalizarRuta(ruta) {
  const limpia =
    limpiarValor(ruta);

  if (!limpia) return "";

  return limpia.startsWith("/")
    ? limpia
    : "/" + limpia;
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
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return "";
}

function extraerPathWebViewApp(appUrl) {
  if (
    !appUrl.startsWith(APP_WEBVIEW_BASE)
  ) {
    return "";
  }

  const resto =
    appUrl.substring(
      APP_WEBVIEW_BASE.length
    );

  const amp =
    resto.indexOf("&");

  return amp === -1
    ? resto
    : resto.substring(0, amp);
}

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
    limpiarValor(producto.app);

  return app.startsWith(APP_WEBVIEW_BASE)
    ? "webview"
    : "native";
}

function construirWebNativaLogin(ruta) {
  const limpia =
    normalizarRuta(ruta);

  return limpia
    ? WEB_LOGIN_BASE + limpia
    : "";
}

function construirWebNativaLanding(url) {
  const limpia =
    limpiarValor(url);

  return esUrlWebValida(limpia)
    ? limpia
    : "";
}

function normalizarDestinoAppNativo(valor) {
  const limpia =
    limpiarValor(valor);

  if (!limpia) {
    return "";
  }

  if (
    limpia.startsWith("scotiabankpe://")
  ) {
    return limpia;
  }

  return (
    APP_SCHEME_BASE +
    limpia.replace(/^\/+/, "")
  );
}

function extraerBaseDeeplinkNativo(appUrl) {
  const app =
    limpiarValor(appUrl);

  if (
    !app.startsWith(APP_SCHEME_BASE)
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
    : sinScheme.substring(0, q);
}

function limpiarCamposConstructor(resetTipo = true) {
  document.getElementById("webviewPath").value =
    "";

  document.getElementById("webviewWebPath").value =
    "";

  document.getElementById("webviewAppPath").value =
    "";

  document.getElementById("differentRoutes").checked =
    false;

  cargarSelectCategoriasWebview();

  document.getElementById("nativeLoginPath").value =
    "";

  document.getElementById("nativeLandingUrl").value =
    "";

  cargarSelectCategoriasNativo();

  setModoWebNativo("login");

  document
    .getElementById("sameRouteBlock")
    .classList.remove("hidden");

  document
    .getElementById("differentRoutesBlock")
    .classList.add("hidden");

  if (resetTipo) {
    setTipoDestino("webview");
  }

  previsualizarRutasGeneradas();
}

function resolverProducto(producto) {
  const tipo =
    detectarTipoProducto(producto);

  if (tipo === "webview") {
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
              normalizarRuta(rutaWeb)
            : ""
        ),

      app:
        producto.app ||
        (
          rutaApp
            ? APP_WEBVIEW_BASE +
              normalizarRuta(rutaApp)
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

function cargarConstructorDesdeProducto(productoOriginal) {
  limpiarCamposConstructor(false);

  const producto =
    resolverProducto(productoOriginal);

  const tipo =
    producto.tipo;

  setTipoDestino(tipo);

  if (tipo === "webview") {
    const rutaWeb =
      producto.rutaWeb;

    const rutaApp =
      producto.rutaApp;

    if (
      rutaWeb &&
      rutaApp &&
      rutaWeb !== rutaApp
    ) {
      document.getElementById("differentRoutes").checked =
        true;

      manejarRutasDiferentes();

      document.getElementById("webviewWebPath").value =
        rutaWeb;

      document.getElementById("webviewAppPath").value =
        rutaApp;
    } else {
      document.getElementById("differentRoutes").checked =
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
      setModoWebNativo("login");

      document.getElementById("nativeLoginPath").value =
        rutaLogin;

      document.getElementById("nativeLandingUrl").value =
        "";
    } else {
      setModoWebNativo("landing");

      document.getElementById("nativeLandingUrl").value =
        webProducto;

      document.getElementById("nativeLoginPath").value =
        "";
    }

    const appBase =
      extraerBaseDeeplinkNativo(
        producto.app || ""
      );

    const normalizedPath =
      appBase
        ? "/" +
          appBase.replace(/^\/+/, "")
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

  if (tipo === "webview") {
    const diferentes =
      document.getElementById("differentRoutes").checked;

    let rutaWeb =
      "";

    let rutaApp =
      "";

    if (diferentes) {
      rutaWeb =
        normalizarRuta(
          document.getElementById("webviewWebPath").value
        );

      rutaApp =
        normalizarRuta(
          document.getElementById("webviewAppPath").value
        );
    } else {
      const ruta =
        normalizarRuta(
          document.getElementById("webviewPath").value
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
          ? WEB_LOGIN_BASE + rutaWeb
          : "",

      app:
        rutaApp
          ? APP_WEBVIEW_BASE + rutaApp
          : ""
    };
  }

  const modoWeb =
    getModoWebNativo();

  const web =
    modoWeb === "login"
      ? construirWebNativaLogin(
          document.getElementById("nativeLoginPath").value
        )
      : construirWebNativaLanding(
          document.getElementById("nativeLandingUrl").value
        );

  const app =
    normalizarDestinoAppNativo(
      document.getElementById("nativeAppDestination").value
    );

  return {
    tipo,
    modoWeb,
    web,
    app
  };
}

function previsualizarRutasGeneradas() {
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
        ? "<br><br><strong>Modo Web:</strong> Ruta interna vía /login (validado)"
        : "<br><br><strong>Modo Web:</strong> Landing / URL directa (requiere prueba GTM)";
  }

  document.getElementById("routePreviewBox").innerHTML =
    `<strong>Vista previa — ${nombre}</strong><br><br>` +
    `<strong>Web:</strong><br>${rutas.web || "Pendiente"}<br><br>` +
    `<strong>App:</strong><br>${rutas.app || "Pendiente"}` +
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
    !esUrlWebValida(rutas.web)
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
    !esDeeplinkValido(rutas.app)
  ) {
    alert(
      "El Deeplink App generado no parece válido."
    );

    return;
  }

  document.getElementById("webUrl").value =
    rutas.web;

  document.getElementById("appUrl").value =
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

  const autoCard =
    document.getElementById("autoResultsCard");

  if (autoCard) {
    autoCard.classList.add("hidden");
  }
}

function limpiarConstructor() {
  document.getElementById("productSelect").value =
    "";

  productoSeleccionado =
    null;

  limpiarCamposConstructor(true);

  document.getElementById("webUrl").value =
    "";

  document.getElementById("appUrl").value =
    "";

  limpiarProbador();

  ocultarResultado();

  renderCatalog();
}


/* =========================================================
   CARGA DE JSON
========================================================= */

async function cargarConfiguracion() {
  const status =
    document.getElementById("dataStatus");

  try {
    const [
      linksResponse,
      nativosResponse,
      campanasResponse
    ] = await Promise.all([
      fetch(
        "./links.json",
        { cache: "no-store" }
      ),

      fetch(
        "./nativos.json",
        { cache: "no-store" }
      ),

      fetch(
        "./campanas.json",
        { cache: "no-store" }
      )
    ]);

    if (!linksResponse.ok) {
      throw new Error(
        "links.json HTTP " +
        linksResponse.status
      );
    }

    if (!nativosResponse.ok) {
      throw new Error(
        "nativos.json HTTP " +
        nativosResponse.status
      );
    }

    if (!campanasResponse.ok) {
      throw new Error(
        "campanas.json HTTP " +
        campanasResponse.status
      );
    }

    const [
      linksData,
      nativosData,
      campanasData
    ] = await Promise.all([
      linksResponse.json(),
      nativosResponse.json(),
      campanasResponse.json()
    ]);

    PRODUCTOS =
      Array.isArray(
        linksData.productos
      )
        ? linksData.productos
        : [];

    WEBVIEW_CATALOG =
      linksData.webview &&
      typeof linksData.webview === "object"
        ? linksData.webview
        : {};

    POR_REVISAR_WEBVIEW =
      Array.isArray(
        linksData.porRevisarWebview
      )
        ? linksData.porRevisarWebview
        : [];

    NATIVE_CATALOG =
      nativosData.nativo &&
      typeof nativosData.nativo === "object"
        ? nativosData.nativo
        : {};

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

    cargarSelectProductos();

    cargarSelectCategoriasWebview();

    cargarSelectCategoriasNativo();

    cargarSelectFuentes();

    renderFuentesAutogenerador();

    renderCatalog();

    const totalWebview =
      contarPathsWebview();

    const totalCategoriasWebview =
      Object.keys(
        WEBVIEW_CATALOG
      ).length;

    const totalNativo =
      contarPantallasNativo();

    const totalCategoriasNativo =
      Object.keys(
        NATIVE_CATALOG
      ).length;

    const totalFuentes =
      Object.keys(
        CAMPAIGN_SOURCES
      ).length;

    status.classList.remove("error");

    status.innerHTML =
      "✓ Configuración cargada: <strong>" +
      PRODUCTOS.length +
      " productos</strong>, <strong>" +
      totalNativo +
      " deeplinks nativos</strong> en <strong>" +
      totalCategoriasNativo +
      " categorías</strong>, <strong>" +
      totalWebview +
      " paths WebView</strong> en <strong>" +
      totalCategoriasWebview +
      " categorías</strong> y <strong>" +
      totalFuentes +
      " fuentes de campaña</strong>.";

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

    renderCatalog();

    status.classList.add("error");

    status.innerHTML =
      "⚠ No se pudo cargar la configuración. Verifica que <strong>deep.html</strong>, " +
      "<strong>styles.css</strong>, <strong>app.js</strong>, <strong>links.json</strong>, " +
      "<strong>nativos.json</strong> y <strong>campanas.json</strong> estén en la misma carpeta " +
      "y que la página se abra desde un servidor Web.";
  }
}

function cargarSelectProductos() {
  const select =
    document.getElementById("productSelect");

  select.innerHTML =
    '<option value="">Nuevo destino / seleccionar producto...</option>';

  PRODUCTOS.forEach(producto => {
    const option =
      document.createElement("option");

    option.value =
      producto.id;

    option.textContent =
      producto.nombre;

    select.appendChild(option);
  });
}

async function iniciar() {
  document.getElementById("sourceInternal").value =
    SOURCE_CAMPAIGN;

  cargarSelectCategoriasWebview();

  cargarSelectCategoriasNativo();

  cambiarTipoDestino();

  cambiarModoWebNativo();

  renderCatalog();

  await cargarConfiguracion();
}


/* =========================================================
   SOURCE / MEDIUM
========================================================= */

function cargarSelectFuentes() {
  const select =
    document.getElementById("utmSource");

  const medium =
    document.getElementById("utmMedium");

  select.innerHTML =
    '<option value="">Seleccionar fuente...</option>';

  Object.keys(
    CAMPAIGN_SOURCES || {}
  ).forEach(source => {
    const option =
      document.createElement("option");

    option.value =
      source;

    const nombre =
      SOURCE_NAMES[source];

    option.textContent =
      nombre
        ? source +
          " — " +
          nombre
        : source;

    select.appendChild(option);
  });

  const otro =
    document.createElement("option");

  otro.value =
    "__otro__";

  otro.textContent =
    "Otro — Escribir manualmente";

  select.appendChild(otro);

  medium.innerHTML =
    '<option value="">Primero selecciona una fuente...</option>';

  medium.disabled =
    true;
}

function cargarMediosPorFuente() {
  const sourceSelect =
    document.getElementById("utmSource");

  const mediumSelect =
    document.getElementById("utmMedium");

  const sourceOtro =
    document.getElementById("utmSourceOtro");

  const mediumOtro =
    document.getElementById("utmMediumOtro");

  const source =
    sourceSelect.value;

  mediumOtro.classList.add("hidden");

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
    sourceOtro.classList.remove("hidden");

    sourceOtro.focus();

    mediumSelect.innerHTML =
      '<option value="">Seleccionar medio...</option>';

    Object.keys(
      MEDIUM_NAMES || {}
    ).forEach(medium => {
      const option =
        document.createElement("option");

      option.value =
        medium;

      option.textContent =
        MEDIUM_NAMES[medium]
          ? medium +
            " — " +
            MEDIUM_NAMES[medium]
          : medium;

      mediumSelect.appendChild(option);
    });

    const otro =
      document.createElement("option");

    otro.value =
      "__otro__";

    otro.textContent =
      "Otro — Escribir manualmente";

    mediumSelect.appendChild(otro);

    mediumSelect.disabled =
      false;

    return;
  }

  sourceOtro.classList.add("hidden");

  sourceOtro.value =
    "";

  const medios =
    Array.isArray(
      CAMPAIGN_SOURCES[source]
    )
      ? CAMPAIGN_SOURCES[source]
      : [];

  mediumSelect.innerHTML =
    '<option value="">Seleccionar medio...</option>';

  medios.forEach(medium => {
    const option =
      document.createElement("option");

    option.value =
      medium;

    const nombre =
      MEDIUM_NAMES[medium];

    option.textContent =
      nombre
        ? medium +
          " — " +
          nombre
        : medium;

    mediumSelect.appendChild(option);
  });

  const otro =
    document.createElement("option");

  otro.value =
    "__otro__";

  otro.textContent =
    "Otro — Escribir manualmente";

  mediumSelect.appendChild(otro);

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
    document.getElementById("utmSource");

  const inputOtro =
    document.getElementById("utmSourceOtro");

  if (
    select.value === "__otro__"
  ) {
    inputOtro.classList.remove("hidden");
  } else {
    inputOtro.classList.add("hidden");

    inputOtro.value =
      "";
  }

  cargarMediosPorFuente();
}

function manejarOtroMedium() {
  const select =
    document.getElementById("utmMedium");

  const inputOtro =
    document.getElementById("utmMediumOtro");

  if (
    select.value === "__otro__"
  ) {
    inputOtro.classList.remove("hidden");

    inputOtro.focus();
  } else {
    inputOtro.classList.add("hidden");

    inputOtro.value =
      "";
  }
}


/* =========================================================
   AUTOGENERADOR
========================================================= */

function mostrarAutogenerador() {
  const panel =
    document.getElementById("autoGeneratorPanel");

  if (!panel) return;

  renderFuentesAutogenerador();

  panel.classList.remove("hidden");

  panel.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

function cerrarAutogenerador() {
  const panel =
    document.getElementById("autoGeneratorPanel");

  if (panel) {
    panel.classList.add("hidden");
  }
}

function renderFuentesAutogenerador() {
  const contenedor =
    document.getElementById("autoSourcesList");

  if (!contenedor) {
    return;
  }

  const sources =
    Object.keys(
      CAMPAIGN_SOURCES || {}
    );

  if (!sources.length) {
    contenedor.innerHTML =
      '<div class="data-status">Los canales disponibles se cargarán desde <strong>campanas.json</strong>.</div>';

    return;
  }

  contenedor.innerHTML =
    "";

  sources.forEach(source => {
    const medios =
      Array.isArray(
        CAMPAIGN_SOURCES[source]
      )
        ? CAMPAIGN_SOURCES[source]
        : [];

    const item =
      document.createElement("label");

    item.className =
      "auto-source-option";

    const checkbox =
      document.createElement("input");

    checkbox.type =
      "checkbox";

    checkbox.className =
      "auto-source-checkbox";

    checkbox.value =
      source;

    const texto =
      document.createElement("span");

    texto.className =
      "auto-source-text";

    const titulo =
      document.createElement("strong");

    titulo.textContent =
      SOURCE_NAMES[source]
        ? source +
          " — " +
          SOURCE_NAMES[source]
        : source;

    const detalle =
      document.createElement("small");

    detalle.textContent =
      medios.length
        ? "Medios: " +
          medios.join(", ")
        : "Sin medios configurados";

    texto.appendChild(titulo);

    texto.appendChild(detalle);

    item.appendChild(checkbox);

    item.appendChild(texto);

    contenedor.appendChild(item);
  });
}

function seleccionarTodasFuentesAuto() {
  document
    .querySelectorAll(
      ".auto-source-checkbox"
    )
    .forEach(input => {
      input.checked =
        true;
    });
}

function limpiarFuentesAuto() {
  document
    .querySelectorAll(
      ".auto-source-checkbox"
    )
    .forEach(input => {
      input.checked =
        false;
    });
}

function obtenerFuentesAutoSeleccionadas() {
  return Array.from(
    document.querySelectorAll(
      ".auto-source-checkbox:checked"
    )
  ).map(input => input.value);
}

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
    limpiarValor(detail)
  ) {
    parametrosCampana.detail =
      limpiarValor(detail);
  }

  const webParametrizada =
    establecerParametros(
      webBase,
      parametrosCampana,
      ["embeddedURL"]
    );

  const appParametrizada =
    establecerParametros(
      appBase,
      parametrosCampana
    );

  const separador =
    webParametrizada.includes("?")
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

function validarBaseAutogenerador() {
  const webBase =
    limpiarValor(
      document.getElementById("webUrl").value
    );

  const appBase =
    limpiarValor(
      document.getElementById("appUrl").value
    );

  const utmCampaign =
    limpiarValor(
      document.getElementById("utmCampaign").value
    );

  if (!webBase) {
    alert(
      "Completa la URL Web antes de autogenerar."
    );

    return null;
  }

  if (
    !esUrlWebValida(webBase)
  ) {
    alert(
      "La URL Web debe comenzar con http:// o https://."
    );

    return null;
  }

  if (!appBase) {
    alert(
      "Completa el Deeplink App antes de autogenerar."
    );

    return null;
  }

  if (
    !esDeeplinkValido(appBase)
  ) {
    alert(
      "El Deeplink App no parece tener un formato válido."
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

    detail:
      limpiarValor(
        document.getElementById("detail").value
      )
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

  if (!fuentes.length) {
    alert(
      "Selecciona al menos un canal para autogenerar."
    );

    return;
  }

  const resultados =
    [];

  fuentes.forEach(source => {
    const medios =
      Array.isArray(
        CAMPAIGN_SOURCES[source]
      )
        ? CAMPAIGN_SOURCES[source]
        : [];

    medios.forEach(medium => {
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
    });
  });

  if (!resultados.length) {
    alert(
      "Las fuentes seleccionadas no tienen medios configurados en campanas.json."
    );

    return;
  }

  AUTO_GENERATED_LINKS =
    resultados;

  renderResultadosAutogenerados();

  const card =
    document.getElementById("autoResultsCard");

  if (card) {
    card.classList.remove("hidden");

    card.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function renderResultadosAutogenerados() {
  const body =
    document.getElementById("autoResultsBody");

  const empty =
    document.getElementById("autoResultsEmpty");

  const content =
    document.getElementById("autoResultsContent");

  const summary =
    document.getElementById("autoResultsSummary");

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
    empty.classList.remove("hidden");

    content.classList.add("hidden");

    return;
  }

  AUTO_GENERATED_LINKS.forEach(
    (item, index) => {
      const tr =
        document.createElement("tr");

      const tdSource =
        document.createElement("td");

      tdSource.textContent =
        item.source;

      const tdMedium =
        document.createElement("td");

      tdMedium.textContent =
        item.medium;

      const tdLink =
        document.createElement("td");

      const linkBox =
        document.createElement("div");

      linkBox.className =
        "auto-link-value";

      linkBox.textContent =
        item.finalUrl;

      tdLink.appendChild(linkBox);

      const tdActions =
        document.createElement("td");

      tdActions.className =
        "auto-row-actions";

      const copyBtn =
        document.createElement("button");

      copyBtn.className =
        "btn-secondary";

      copyBtn.textContent =
        "Copiar";

      copyBtn.onclick =
        () =>
          copiarLinkAuto(index);

      const testBtn =
        document.createElement("button");

      testBtn.className =
        "btn-secondary";

      testBtn.textContent =
        "Probar";

      testBtn.onclick =
        () =>
          probarLinkAuto(index);

      tdActions.appendChild(copyBtn);

      tdActions.appendChild(testBtn);

      tr.appendChild(tdSource);

      tr.appendChild(tdMedium);

      tr.appendChild(tdLink);

      tr.appendChild(tdActions);

      body.appendChild(tr);
    }
  );

  const fuentesUnicas =
    new Set(
      AUTO_GENERATED_LINKS.map(
        item => item.source
      )
    ).size;

  summary.innerHTML =
    "<strong>Autogeneración completada</strong><br><br>" +
    "Se generaron <strong>" +
    AUTO_GENERATED_LINKS.length +
    " links</strong> para <strong>" +
    fuentesUnicas +
    " fuentes</strong>. Cada fila corresponde a una combinación válida " +
    "<strong>utm_source + utm_medium</strong> de campanas.json.";

  empty.classList.add("hidden");

  content.classList.remove("hidden");
}

async function escribirPortapapeles(valor) {
  try {
    await navigator.clipboard.writeText(
      valor
    );

    return true;

  } catch (error) {
    const textarea =
      document.createElement("textarea");

    textarea.value =
      valor;

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

async function copiarLinkAuto(index) {
  const item =
    AUTO_GENERATED_LINKS[index];

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
    AUTO_GENERATED_LINKS[index];

  if (
    !item ||
    !item.finalUrl
  ) {
    return;
  }

  window.location.href =
    item.finalUrl;
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
      .map(item =>
        item.source +
        "\t" +
        item.medium +
        "\t" +
        item.finalUrl
      )
      .join("\n");

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
    String(valor ?? "");

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

  AUTO_GENERATED_LINKS.forEach(item => {
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
  });

  const csv =
    filas
      .map(fila =>
        fila
          .map(escaparCsv)
          .join(",")
      )
      .join("\r\n");

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
    document.createElement("a");

  const nombreCampana =
    limpiarValor(
      document.getElementById("utmCampaign").value
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

  const panel =
    document.getElementById("autoGeneratorPanel");

  const card =
    document.getElementById("autoResultsCard");

  const body =
    document.getElementById("autoResultsBody");

  const empty =
    document.getElementById("autoResultsEmpty");

  const content =
    document.getElementById("autoResultsContent");

  if (panel) {
    panel.classList.add("hidden");
  }

  if (card) {
    card.classList.add("hidden");
  }

  if (body) {
    body.innerHTML =
      "";
  }

  if (empty) {
    empty.classList.remove("hidden");
  }

  if (content) {
    content.classList.add("hidden");
  }

  limpiarFuentesAuto();
}


/* =========================================================
   PRODUCTOS
========================================================= */

function seleccionarProducto(id) {
  const productoBase =
    PRODUCTOS.find(
      producto =>
        producto.id === id
    );

  productoSeleccionado =
    productoBase || null;

  if (!productoBase) {
    document.getElementById("webUrl").value =
      "";

    document.getElementById("appUrl").value =
      "";

    limpiarCamposConstructor(true);

    limpiarProbador();

    ocultarResultado();

    renderCatalog();

    return;
  }

  const producto =
    resolverProducto(
      productoBase
    );

  document.getElementById("webUrl").value =
    producto.web;

  document.getElementById("appUrl").value =
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
    document.getElementById("autoResultsCard");

  if (autoCard) {
    autoCard.classList.add("hidden");
  }

  renderCatalog();
}

function seleccionarDesdeCatalogo(id) {
  document.getElementById("productSelect").value =
    id;

  seleccionarProducto(id);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function renderCatalog() {
  const catalog =
    document.getElementById("catalog");

  const search =
    document
      .getElementById("catalogSearch")
      .value
      .toLowerCase()
      .trim();

  if (!PRODUCTOS.length) {
    catalog.innerHTML =
      '<div class="empty">El catálogo se cargará desde links.json.</div>';

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
          ).toLowerCase();

        return texto.includes(
          search
        );
      }
    );

  catalog.innerHTML =
    "";

  if (!filtrados.length) {
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
        document.createElement("div");

      div.className =
        "product";

      if (
        productoSeleccionado &&
        productoSeleccionado.id === producto.id
      ) {
        div.classList.add(
          "active"
        );
      }

      div.onclick =
        () =>
          seleccionarDesdeCatalogo(
            producto.id
          );

      div.innerHTML = `
        <div class="product-name">
          ${producto.nombre}
        </div>

        <div class="product-path">
          <strong>Web:</strong><br>
          ${producto.web || "Pendiente de configurar"}
        </div>

        <div class="product-path">
          <strong>App:</strong><br>
          ${producto.app || "Pendiente de configurar"}
        </div>

        <span class="badge">
          ${
            producto.tipo === "webview"
              ? "WebView"
              : "Nativo"
          }
        </span>
      `;

      catalog.appendChild(div);
    }
  );
}


/* =========================================================
   UTILIDADES
========================================================= */

function limpiarValor(valor) {
  return String(
    valor ?? ""
  ).trim();
}

function normalizarTaxonomia(valor) {
  return limpiarValor(
    valor
  ).toLowerCase();
}

function esUrlWebValida(url) {
  return (
    url.startsWith("https://") ||
    url.startsWith("http://")
  );
}

function esDeeplinkValido(deeplink) {
  return (
    deeplink.includes("://") &&
    !deeplink.includes(" ")
  );
}

function establecerParametros(
  urlBase,
  parametros,
  parametrosAEliminar = []
) {
  let original =
    limpiarValor(
      urlBase
    );

  let hash =
    "";

  const hashIndex =
    original.indexOf("#");

  if (
    hashIndex !== -1
  ) {
    hash =
      original.substring(
        hashIndex
      );

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

  const pares =
    queryOriginal
      ? queryOriginal.split("&")
      : [];

  const mapa =
    new Map();

  pares.forEach(par => {
    if (!par) return;

    const index =
      par.indexOf("=");

    let key;
    let value;

    if (
      index === -1
    ) {
      key =
        par;

      value =
        "";
    } else {
      key =
        par.substring(
          0,
          index
        );

      value =
        par.substring(
          index + 1
        );
    }

    let keyNormalizada;

    try {
      keyNormalizada =
        decodeURIComponent(
          key
        );
    } catch {
      keyNormalizada =
        key;
    }

    mapa.set(
      keyNormalizada,
      {
        keyOriginal:
          key,

        valueOriginal:
          value
      }
    );
  });

  parametrosAEliminar.forEach(
    key =>
      mapa.delete(key)
  );

  Object.entries(
    parametros
  ).forEach(
    ([key, value]) => {
      const limpio =
        limpiarValor(
          value
        );

      if (!limpio) {
        mapa.delete(
          key
        );

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
        ? "?" +
          nuevaQuery
        : ""
    ) +
    hash
  );
}

function construirLinkPrueba(
  webBase,
  appBase
) {
  const webLimpia =
    establecerParametros(
      webBase,
      {},
      ["embeddedURL"]
    );

  if (!appBase) {
    return webLimpia;
  }

  const separador =
    webLimpia.includes("?")
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
  document.getElementById("testProductName").textContent =
    "Probando: " +
    nombre;

  document.getElementById("testWebLink").value =
    web || "";

  document.getElementById("testAppLink").value =
    app || "";

  actualizarEnlaceApp();

  document.getElementById("testFinalLink").value =
    web
      ? construirLinkPrueba(
          web,
          app
        )
      : "";

  document.getElementById("testConsole").innerHTML =
    "<strong>Diagnóstico del Deeplink App</strong><br>" +
    (
      app
        ? "Deeplink cargado. Presiona <strong>Abrir Deeplink App</strong> para probarlo."
        : "Este destino no tiene Deeplink App configurado."
    );
}


/* =========================================================
   GENERACIÓN INDIVIDUAL
========================================================= */

function generarLink() {
  const webBase =
    limpiarValor(
      document.getElementById("webUrl").value
    );

  const appBase =
    limpiarValor(
      document.getElementById("appUrl").value
    );

  const sourceSeleccionado =
    document.getElementById("utmSource").value;

  const utmSource =
    normalizarTaxonomia(
      sourceSeleccionado === "__otro__"
        ? document.getElementById("utmSourceOtro").value
        : sourceSeleccionado
    );

  const mediumSeleccionado =
    document.getElementById("utmMedium").value;

  const utmMedium =
    normalizarTaxonomia(
      mediumSeleccionado === "__otro__"
        ? document.getElementById("utmMediumOtro").value
        : mediumSeleccionado
    );

  const utmCampaign =
    limpiarValor(
      document.getElementById("utmCampaign").value
    );

  const detail =
    limpiarValor(
      document.getElementById("detail").value
    );

  if (!webBase) {
    alert(
      "Completa la URL Web."
    );

    return;
  }

  if (
    !esUrlWebValida(webBase)
  ) {
    alert(
      "La URL Web debe comenzar con http:// o https://."
    );

    return;
  }

  if (!appBase) {
    alert(
      "Completa el Deeplink App."
    );

    return;
  }

  if (
    !esDeeplinkValido(appBase)
  ) {
    alert(
      "El Deeplink App no parece tener un formato válido."
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

  const parametrosCampana = {
    utm_source:
      utmSource,

    utm_medium:
      utmMedium,

    utm_campaign:
      utmCampaign,

    source:
      SOURCE_CAMPAIGN
  };

  if (detail) {
    parametrosCampana.detail =
      detail;
  }

  const webParametrizada =
    establecerParametros(
      webBase,
      parametrosCampana,
      ["embeddedURL"]
    );

  const appParametrizada =
    establecerParametros(
      appBase,
      parametrosCampana
    );

  const separador =
    webParametrizada.includes("?")
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

  document.getElementById("finalUrl").textContent =
    finalUrl;

  document.getElementById("finalEncodedPreview").textContent =
    finalUrl;

  document.getElementById("finalDecodedPreview").textContent =
    finalUrlSinEncodear;

  document.getElementById("webPreview").textContent =
    webParametrizada;

  document.getElementById("webEncodedPreview").textContent =
    webEncodeada;

  document.getElementById("appPreview").textContent =
    appParametrizada;

  document.getElementById("appEncodedPreview").textContent =
    appEncodeada;

  const modeNote =
    document.getElementById("generationModeNote");

  const rutasActuales =
    obtenerRutasDesdeConstructor();

  if (
    rutasActuales.tipo === "native" &&
    rutasActuales.modoWeb === "landing"
  ) {
    modeNote.className =
      "mode-note experimental";

    modeNote.innerHTML =
      "<strong>Landing directa / modo de prueba</strong><br>" +
      "El link fue generado con embeddedURL, pero esta landing no necesariamente abrirá la App por sí sola. " +
      "La siguiente etapa es probar en GTM la lectura de embeddedURL y el intento de apertura del deeplink.";

  } else if (
    rutasActuales.tipo === "native" &&
    rutasActuales.modoWeb === "login"
  ) {
    modeNote.className =
      "mode-note verified";

    modeNote.innerHTML =
      "<strong>Wrapper /login</strong><br>" +
      "Este modo usa la estructura que ya comprobamos que procesa embeddedURL.";

  } else {
    modeNote.className =
      "mode-note verified";

    modeNote.innerHTML =
      "<strong>WebView</strong><br>" +
      "Se usa /login como wrapper y webView?path=... como Deeplink App.";
  }

  document
    .getElementById("resultBox")
    .classList.add("visible");

  document
    .getElementById("emptyResult")
    .classList.add("hidden");
}

function ocultarResultado() {
  document
    .getElementById("resultBox")
    .classList.remove("visible");

  document
    .getElementById("emptyResult")
    .classList.remove("hidden");

  const modeNote =
    document.getElementById("generationModeNote");

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
    document.getElementById(
      elementId
    );

  const valor =
    element
      ? element.textContent
      : "";

  if (!valor) {
    return;
  }

  try {
    await navigator.clipboard.writeText(
      valor
    );

    alert(
      nombre +
      " copiado correctamente."
    );

  } catch (error) {
    const textarea =
      document.createElement("textarea");

    textarea.value =
      valor;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

    alert(
      nombre +
      " copiado correctamente."
    );
  }
}

async function copiarFinal() {
  const link =
    document.getElementById("finalUrl").textContent;

  if (!link) {
    return;
  }

  try {
    await navigator.clipboard.writeText(
      link
    );

    alert(
      "Link copiado correctamente."
    );

  } catch (error) {
    const textarea =
      document.createElement("textarea");

    textarea.value =
      link;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

    alert(
      "Link copiado correctamente."
    );
  }
}

function abrirFinal() {
  const link =
    document.getElementById("finalUrl").textContent;

  if (!link) {
    return;
  }

  window.location.href =
    link;
}


/* =========================================================
   PROBADOR
========================================================= */

function probarLinkExistente() {
  const link =
    limpiarValor(
      document.getElementById("testFinalLink").value
    );

  if (!link) {
    alert(
      "Selecciona un producto o pega un link combinado."
    );

    return;
  }

  if (
    !esUrlWebValida(link)
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
      document.getElementById("testWebLink").value
    );

  if (!link) {
    alert(
      "Selecciona un producto o pega una URL Web."
    );

    return;
  }

  if (
    !esUrlWebValida(link)
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
  const link =
    limpiarValor(
      document.getElementById("testAppLink").value
    );

  const enlace =
    document.getElementById("testAppAnchor");

  if (!enlace) {
    return;
  }

  if (
    link.startsWith("scotiabankpe://")
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
      document.getElementById("testAppLink").value
    );

  const consola =
    document.getElementById("testConsole");

  const enlace =
    document.getElementById("testAppAnchor");

  if (!link) {
    alert(
      "Selecciona un producto o pega un Deeplink App."
    );

    enlace.href =
      "#";

    return false;
  }

  if (
    !link.startsWith("scotiabankpe://")
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

  consola.innerHTML = `
    <strong>Diagnóstico del Deeplink App</strong><br><br>

    <span class="info">
      Enlace HTML real:
    </span><br>

    &lt;a href="${link}"&gt;Abrir Deeplink App&lt;/a&gt;<br><br>

    <span class="info">
      Estado:
    </span>

    clic del usuario enviado directamente al esquema...
  `;

  console.log(
    "[DEEPLINK ANCHOR TEST] href:",
    link
  );

  const detectarCambio =
    () => {
      if (
        document.hidden &&
        !paginaOculta
      ) {
        paginaOculta =
          true;

        consola.innerHTML += `
          <br><br>

          <span class="ok">
            ✓ La página pasó a segundo plano.
            Es una señal compatible con que Android haya entregado
            el deeplink a la app o a un selector externo.
          </span>
        `;

        console.log(
          "[DEEPLINK ANCHOR TEST] La página pasó a segundo plano."
        );
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
        consola.innerHTML += `
          <br><br>

          <span class="warn">
            ⚠ La página siguió visible.
            El navegador o el sistema no abrió una aplicación con este esquema
            en esta prueba.
          </span>

          <br><br>

          <span class="info">
            En PC esto es normal si no existe una aplicación registrada para
            scotiabankpe://. En Android, si la app está instalada y aun así no abre,
            conviene validar el registro del esquema/deeplink en la app o probarlo
            directamente en el entorno de Meta.
          </span>
        `;

        console.warn(
          "[DEEPLINK ANCHOR TEST] La página siguió visible."
        );
      }
    },
    1800
  );

  return true;
}

async function copiarDeeplinkApp() {
  const link =
    limpiarValor(
      document.getElementById("testAppLink").value
    );

  if (!link) {
    alert(
      "No hay Deeplink App para copiar."
    );

    return;
  }

  try {
    await navigator.clipboard.writeText(
      link
    );

    alert(
      "Deeplink App copiado correctamente."
    );

  } catch (error) {
    const textarea =
      document.createElement("textarea");

    textarea.value =
      link;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

    alert(
      "Deeplink App copiado correctamente."
    );
  }
}

function limpiarProbador() {
  document.getElementById("testProductName").textContent =
    "Selecciona un producto para comenzar.";

  document.getElementById("testFinalLink").value =
    "";

  document.getElementById("testWebLink").value =
    "";

  document.getElementById("testAppLink").value =
    "";

  actualizarEnlaceApp();

  document.getElementById("testConsole").innerHTML =
    "<strong>Diagnóstico del Deeplink App</strong><br>" +
    "Selecciona un producto y presiona <strong>Abrir Deeplink App</strong>.";
}


/* =========================================================
   LIMPIEZA GENERAL
========================================================= */

function limpiarFormulario() {
  document.getElementById("productSelect").value =
    "";

  document.getElementById("webUrl").value =
    "";

  document.getElementById("appUrl").value =
    "";

  document.getElementById("utmSource").value =
    "";

  document.getElementById("utmSourceOtro").value =
    "";

  document
    .getElementById("utmSourceOtro")
    .classList.add("hidden");

  document.getElementById("utmMedium").innerHTML =
    '<option value="">Primero selecciona una fuente...</option>';

  document.getElementById("utmMedium").disabled =
    true;

  document.getElementById("utmMediumOtro").value =
    "";

  document
    .getElementById("utmMediumOtro")
    .classList.add("hidden");

  document.getElementById("utmCampaign").value =
    "";

  document.getElementById("sourceInternal").value =
    SOURCE_CAMPAIGN;

  document.getElementById("detail").value =
    "";

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

iniciar();
