/* ===========================================================
   GENERADOR DE LINKS MARKETING v3.4 · ASISTENTE SIN API
   Motor local determinista: NO usa Gemini, ChatGPT ni servicios
   externos. Interpreta sugerencias; NUNCA inventa rutas.
   Solo app.js construye el enlace final.
=========================================================== */
(function () {
  "use strict";

  const EXAMPLES = Object.freeze({
    meta: "Quiero un enlace de Meta Ads hacia Para ti. Si tiene la App, que abra Para ti, y si no la tiene, que vaya al login web. utm_campaign=tc_beneficios_tactica_conversion y detail=boton_principal.",
    interno: "Necesito un link para un botón dentro de la web del banco que lleve a Cambiar Dólares. Sin UTM, con source=campaign y detail=boton_cambio_dolares.",
    ruta: "En Google Ads quiero abrir la App y, si no se abre, ir al login web. Tengo la ruta WebView /u/term/term-deposit/close/init. utm_campaign=depositos_plazo_tactica_conversion.",
    clientes: "Para una campaña de email quiero que los clientes entren a Para ti en la App o login web, y los que no sean clientes vayan a una landing comercial."
  });
  const has = (text, pattern) => pattern.test(text);
  const normalize = (text) => String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-_]+/g, " ").replace(/[^a-z0-9\/ ]+/g, " ").replace(/\s+/g, " ").trim();
  const trimToken = (text) => String(text || "").trim().replace(/[.,!?;]+$/g, "");
  function getExplicit(text, key) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const r = new RegExp("(?:^|[^a-zA-Z0-9_])" + escaped + "\\s*[:=]\\s*(?:\\\"([^\\\"]+)\\\"|'([^']+)'|([^\\s,;&]+))", "i");
    const m = String(text || "").match(r);
    return m ? trimToken(m[1] || m[2] || m[3]) : "";
  }
  function getQueryValue(url, name) {
    try { return new URL(url).searchParams.get(name) || ""; } catch (_) { return ""; }
  }
  function detectChannel(norm) {
    if (has(norm, /\b(meta ads|facebook|instagram|meta)\b/)) return "meta";
    if (has(norm, /\b(google ads|adwords|google|pmax|performance max)\b/)) return "google";
    if (has(norm, /\b(tiktok)\b/)) return "tiktok";
    if (has(norm, /\b(whatsapp|wsp|wasap)\b/)) return "whatsapp";
    if (has(norm, /\b(email|correo|correos|mailing|newsletter|masterbase|epsilon|crm)\b/)) return "email";
    if (has(norm, /\b(sms|mensaje de texto)\b/)) return "sms";
    if (has(norm, /\b(push|notificacion)\b/)) return "push";
    if (has(norm, /\b(qr|codigo qr|afiche|folleto)\b/)) return "qr";
    if (has(norm, /\b(boton interno|banner interno|navegacion interna|dentro de la web|dentro del banco|en la landing del banco|desde la landing|dentro de una landing|en nuestra web)\b/)) return "internal";
    return "";
  }
  function detectIntent(norm) {
    // «Campaña para no clientes» es una AUDIENCIA, no significa enrutamiento condicional.
    const conditionalClient = has(norm, /\b(si no (?:es|son|sean) clientes?|si (?:es|son|sean) clientes?|(?:los que )?no sean clientes?|clientes? y no clientes?|clientes? versus no clientes?|clientes? vs no clientes?)\b/);
    const clientVsNonclient = has(norm, /\bclientes?\b.{0,110}\bno clientes?\b/) && has(norm,/\b(si|entonces|sino|landing|redirige|mandar|enviar|separa)\b/);
    if (conditionalClient || clientVsNonclient) return "clientes";
    const app = has(norm, /\b(app|aplicacion|deeplink|nativa|webview|web view|browser)\b/);
    const web = has(norm, /\b(web|landing|login web|sitio|pagina|navegador|open market|openmarket)\b/);
    if (has(norm, /\b(solo app|solamente app|solo deeplink)\b/)) return "app";
    if (has(norm, /\b(solo web|solamente web|solo landing|solo pagina|sin app|no quiero app|solo open market|directo a open market)\b/) &&
        !has(norm, /\b(si (?:tiene|esta|no tiene|no se abre) (?:la )?app|con o sin app|app o web|app y web)\b/)) return "web";
    if (app && (web || has(norm, /\b(si no la tiene|si no tiene app|sin la app|con o sin app|si no abre)\b/))) return "combinado";
    if (app) return "app";
    return "web";
  }
  function exactRouteCandidates(norm, products) {
    const matches = [];
    const ALIASES = {
      "para-ti": ["para ti", "marketplace"],
      "cambiar-dolares": ["cambiar dolares", "cambio de dolares", "tipo de cambio", "exchange"],
      "cuenta-digital-kyc": ["cuenta digital"],
      "cuenta-power-kyc": ["cuenta power"],
      "cuenta-sueldo-dependiente-kyc": ["cuenta sueldo"],
      "dashboard-inicio": ["dashboard", "inicio de app"],
      "ver-mis-productos": ["ver mis productos", "mis productos"]
    };
    for (const p of products || []) {
      const label = normalize(p.nombre);
      const id = normalize(p.id);
      const aliases = [...(ALIASES[p.id] || []), label, id].map(normalize).filter(x => x.length >= 5);
      let strongest = 0;
      for (const alias of aliases) {
        const re = new RegExp("(?:^|\\s)" + alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:$|\\s)");
        if (re.test(norm)) strongest = Math.max(strongest, alias.length + (alias === label ? 12 : 0));
      }
      if (strongest) matches.push({id:p.id,name:p.nombre,score:strongest});
    }
    matches.sort((a,b) => b.score-a.score);
    // If an exact sub-product is present, do not also match a broader product.
    const max = matches[0]?.score || 0;
    return matches.filter((m,i) => i < 5 && m.score >= Math.max(5,max-8));
  }
  function interpret(text, products) {
    const request = String(text || "").trim();
    const norm = normalize(request);
    const channel = detectChannel(norm);
    const intent = detectIntent(norm);
    const urls = [...request.matchAll(/https?:\/\/[^\s<>"'\[\]]+/gi)].map(m=>trimToken(m[0]));
    const deep = [...request.matchAll(/scotiabankpe:\/\/\/[^\s<>"'\[\]]+/gi)].map(m=>trimToken(m[0]));
    const paths = [...request.matchAll(/\/u\/[a-zA-Z0-9/_;=.%?&-]+/g)].map(m=>trimToken(m[0]));
    let web = urls[0] || "";
    let app = deep[0] || "";
    const productCandidates = exactRouteCandidates(norm, products);
    const warnings = [];
    if (productCandidates.length > 1) warnings.push("Se encontraron varios destinos posibles. Selecciona el correcto en la lista.");
    const selected = productCandidates.length === 1 ? productCandidates[0].id : "";
    const implicitBrowser = has(norm, /\b(browser|navegador de la app|dentro del browser)\b/);
    if (!app && urls.length && implicitBrowser) app = "scotiabankpe:///browser?url="+encodeURIComponent(web);
    if (!app && paths.length) {
      const path = paths[0];
      app = "scotiabankpe:///webView?path="+path;
      if (!web) web = "https://mi.scotiabank.com.pe/login?redirectTo="+path;
      warnings.push("Se construyó un formato WebView a partir de una ruta /u/ explícita. Falta confirmar que esa pantalla exista y esté habilitada.");
    }
    if (web && !app) {
      const embed = getQueryValue(web,"embeddedURL");
      if (embed.startsWith("scotiabankpe:///")) app=embed;
    }
    if (!web && app && app.startsWith("scotiabankpe:///browser?url=")) {
      try { const value = new URL(app).searchParams.get("url"); if (value && /^https?:\/\//.test(value)) web=value; } catch (_) { /* ignored */ }
    }
    if (selected && !paths.length && !urls.length && !deep.length) {
      const p=(products || []).find(p=>p.id===selected);
      if (p && typeof resolverProducto==="function") {
        const prod=resolverProducto(p);
        web = prod.web || "";
        app = prod.app || "";
      }
    }
    if (selected && /-kyc$/.test(selected)) warnings.push("El catálogo identifica este destino como KYC. No equivale necesariamente al onboarding público de Open Market.");
    if (has(norm,/\b(open market|openmarket)\b/) && !urls.length) {
      warnings.push("Mencionaste Open Market, pero no proporcionaste su URL pública. El asistente no la deduce del destino KYC; pégala para evitar confusiones.");
      if (selected && /-kyc$/.test(selected)) { web=""; app=""; }
    }
    if (has(norm, /\b(si no tiene app|si no la tiene|si no abre|cuando no tenga app)\b/) && has(norm,/\b(landing|openmarket|open market)\b/)) {
      warnings.push("Un enlace combinado con embeddedURL no garantiza enviar a una landing al usuario sin App. Para ese fallback se necesita una solución validada por Tecnología.");
    }
    if (intent === "clientes") warnings.push("La opción Clientes / No clientes es solo una ficha de requisitos; el generador bloquea su publicación hasta que Tecnología implemente la segmentación.");
    if (intent === "app" && ["email","qr","sms","whatsapp"].includes(channel)) warnings.push("Los deeplinks App directos pueden no abrirse en el canal elegido y no tienen fallback web garantizado.");
    if (intent === "combinado") warnings.push("Web + App debe probarse en Android, iOS y sin la App instalada; no detecta por sí solo la instalación.");
    if (/(dni|numero de documento|documento de identidad|telefono|celular|correo personal|contrase[ñn]a)\s*[:=]/i.test(request)) warnings.push("Evita incluir datos personales o credenciales en URLs o solicitudes de Marketing.");
    const explicit = (k)=> getExplicit(request,k) || (web ? getQueryValue(web,k) : "");
    const campaignParts = ["producto", "campana", "tipo", "objetivo"].map(k => getExplicit(request,k === "campana" ? "campaña" : k) || getExplicit(request,k));
    const compositeCampaign = campaignParts.every(Boolean) ? campaignParts.map(x=>normalize(x).replace(/\s+/g,"_")).join("_") : "";
    const campaign = explicit("utm_campaign") || compositeCampaign || (request.match(/(?:mi\s+)?campa[ñn]a\s+(?:se llama|es)\s+["“]?([\w-]+)["”]?/i)?.[1] || "");
    const content = explicit("utm_content");
    const term = explicit("utm_term");
    const source = explicit("source");
    const mentionPrincipal = /\b(?:identificar|diferenciar)\s+(?:el\s+)?(?:boton|cta)\s+(principal|secundario)\b/.exec(norm);
    const detail = explicit("detail") || (mentionPrincipal ? "boton_"+mentionPrincipal[1] : "");
    const cliente = explicit("cliente");
    const utmCanal = explicit("utm_canal");
    const utmSource = explicit("utm_source") || GUIA_CANALES[channel]?.source || "";
    const utmMedium = explicit("utm_medium") || GUIA_CANALES[channel]?.medium || "";
    const noUtm = channel === "internal" || has(norm,/\b(sin utm|sin utms|no agregues utm|no quiero utm)\b/);
    if (channel && channel !== "internal" && noUtm) warnings.push("Pediste un canal externo sin UTM. Revisa si esto coincide con la política de medición de Marketing.");
    if (channel && !noUtm && !campaign) warnings.push("Falta utm_campaign. El generador te permitirá construirlo con cuatro campos o escribirlo manualmente.");
    return {request,channel,intent,productId:selected,candidates:productCandidates,web,app,fallback: "", campaign,content,term,source,detail,cliente:cliente==="true"||cliente==="false"?cliente:"",utmCanal,utmSource,utmMedium,noUtm,warnings};
  }

  window.ASISTENTE_CORE = Object.freeze({normalize,detectChannel,detectIntent,exactRouteCandidates,interpret});
  let analysis=null;
  const el=(id)=> document.getElementById(id);
  const value=(id)=>el(id)?.value?.trim() || "";
  const set=(id,text)=>{if(el(id)) el(id).value=String(text || "");};
  const node=(tag,text,klass)=>{const n=document.createElement(tag);if(text !== undefined) n.textContent=text;if(klass)n.className=klass;return n;};
  const safeWeb=(url)=>/^https?:\/\//i.test(url) && !/\s/.test(url);
  const safeApp=(url)=>/^scotiabankpe:\/\/\/[^\s]+$/i.test(url);
  function showError(msg){const e=el("assistantError");e.textContent=msg;e.classList.remove("hidden");}
  function resetError(){el("assistantError")?.classList.add("hidden");}
  function populateCatalog(selected){
    const select=el("assistantProduct"); if(!select)return;
    select.replaceChildren(new Option("No utilizar catálogo · escribir rutas", ""));
    (PRODUCTOS || []).slice().sort((a,b)=>a.nombre.localeCompare(b.nombre,"es")).forEach(p=>select.add(new Option(p.nombre,p.id)));
    select.value=(PRODUCTOS || []).some(p=>p.id===selected)?selected:"";
  }
  function hydrate(analysis){
    populateCatalog(analysis.productId);
    for(const [name,id] of Object.entries({channel:"assistantChannel",intent:"assistantIntent",web:"assistantWeb",app:"assistantApp",fallback:"assistantFallback",campaign:"assistantCampaign",content:"assistantContent",term:"assistantTerm",source:"assistantSource",detail:"assistantDetail",cliente:"assistantCliente",utmCanal:"assistantUtmCanal",utmSource:"assistantUtmSource",utmMedium:"assistantUtmMedium"})) set(id,analysis[name]);
    el("assistantResult").classList.remove("hidden");
    review();
    el("assistantResult").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function review(){
    if(!analysis) return;
    const mode=value("assistantIntent");
    const channel=value("assistantChannel");
    const src=value("assistantUtmSource");
    const med=value("assistantUtmMedium");
    const web=value("assistantWeb");
    const app=value("assistantApp");
    const fallback=value("assistantFallback");
    el("assistantFallbackBox")?.classList.toggle("hidden",mode!=="clientes");
    const summary=el("assistantSummary");summary.replaceChildren();
    const labels={web:"Solo Web",app:"Solo App",combinado:"App o login Web",clientes:"Clientes / No clientes · no publicable"};
    const cl=el("assistantChannel").selectedOptions?.[0]?.textContent || "Por definir";
    summary.append(node("span",cl,"assistant-summary-chip"),node("span",labels[mode]||mode,"assistant-summary-chip"),node("span",(channel==="internal"||analysis.noUtm)?"Sin UTM":"Con UTM sugeridas","assistant-summary-chip"));
    const messages=[];
    if(!channel) messages.push(["pendiente","Elige dónde compartirás el enlace; no voy a adivinar el canal."]);
    if(mode!=="app" && !safeWeb(web)) messages.push(["pendiente","Falta una URL Web válida. Busca un destino en el catálogo o pégalo manualmente."]);
    if(mode!=="web" && !safeApp(app)) messages.push(["pendiente","Falta un deeplink App de Scotiabank. Selecciona una ruta del catálogo o completa la ruta."]);
    if(mode==="clientes" && !safeWeb(fallback)) messages.push(["pendiente","Falta la landing pública para no clientes. Se usará solo en la ficha técnica."]);
    if(channel && channel!=="internal" && (!src || !med)) messages.push(["pendiente","Revisa utm_source y utm_medium. Puedes editarlos en «Revisar UTM»."]);
    if(channel && channel!=="internal" && !value("assistantCampaign")) messages.push(["pendiente","utm_campaign está pendiente. Puedes escribirlo aquí o construirlo en el Paso 3."]);
    const warnings=analysis.warnings.filter(w=>
      (mode==="clientes" || !w.includes("Clientes / No clientes")) &&
      (mode==="combinado" || !w.includes("Web + App debe probarse"))
    );
    if(mode==="clientes" && !warnings.some(w=>/Clientes \/ No clientes/.test(w))) warnings.push("La selección automática de clientes no está implementada. No se permite publicar esta modalidad.");
    if(mode==="combinado" && !warnings.some(w=>/Web \+ App/.test(w))) warnings.push("Web + App requiere pruebas; embeddedURL no garantiza el fallback cuando no se abre la App.");
    if(channel==="internal") warnings.push("No se añadirán UTM al escoger navegación interna. source y detail siguen siendo opcionales.");
    const checks=el("assistantChecks");checks.replaceChildren();
    const status=messages.length?node("div",messages.length+" dato(s) por revisar antes de generar el enlace.","assistant-check-title"):node("div","Configuración básica completa. Revisa los destinos y la medición en el generador.","assistant-check-title okay");
    checks.append(status);
    messages.forEach(([,msg])=>checks.append(node("p","• "+msg,"assistant-check-pending")));
    [...new Set(warnings)].forEach(msg=>checks.append(node("p","⚠ "+msg,"assistant-check-warning")));
    checks.append(node("p","source, detail y los demás parámetros personalizados no se registran automáticamente en GA4: requieren instrumentación.","assistant-check-neutral"));
  }
  function interpretUi(){
    resetError();
    const request=value("assistantRequest");
    if(request.length<15){showError("Describe con un poco más de detalle lo que necesitas (mínimo 15 caracteres).");el("assistantRequest").focus();return;}
    analysis=interpret(request,PRODUCTOS || []);
    hydrate(analysis);
  }
  function changeProduct(){
    if(!analysis)return;
    const id=value("assistantProduct");
    const p=(PRODUCTOS || []).find(p=>p.id===id);
    if(p){
      const data=resolverProducto(p);
      set("assistantWeb",data.web || "");set("assistantApp",data.app || "");
      if(/-kyc$/.test(id) && !analysis.warnings.some(x=>x.includes("KYC"))) analysis.warnings.push("Este destino es KYC y podría no corresponder al onboarding público de Open Market.");
    }
    review();
  }
  function apply(){
    if(!analysis)return showError("Primero interpreta una solicitud.");
    resetError();
    // No se conserva información de una campaña anterior por error.
    limpiarFormulario();
    const channel=value("assistantChannel");
    const mode=value("assistantIntent");
    const channelInput=el("guidedChannel");
    channelInput.value=channel;
    cambiarCanalGuiado();
    establecerModoGuiado(mode);
    const pId=value("assistantProduct");
    if(pId) seleccionarProducto(pId);
    set("webUrl",value("assistantWeb"));set("appUrl",value("assistantApp"));set("nonClientLandingUrl",value("assistantFallback"));
    const noUtm=channel==="internal" || analysis.noUtm;
    const radio=document.querySelector('input[name="measurementMode"][value="'+(noUtm?"interno":"campana")+'"]');
    if(radio)radio.checked=true;
    actualizarModoMedicion();
    const src=value("assistantUtmSource"),med=value("assistantUtmMedium");
    if(!noUtm && src && med) seleccionarTaxonomiaSugerida(src,med);
    const campaign=value("assistantCampaign");
    if(campaign){
      const nameRadio=document.querySelector('input[name="campaignNameMode"][value="manual"]');if(nameRadio)nameRadio.checked=true;
      set("campaignManual",campaign);
    }
    actualizarModoNombreCampana();
    set("utmContent",value("assistantContent"));set("utmTerm",value("assistantTerm"));
    set("sourceInternal",value("assistantSource"));el("sourceInternal").dataset.sourceEditado="true";
    set("detail",value("assistantDetail"));set("clienteExtra",value("assistantCliente"));set("utmCanalExtra",value("assistantUtmCanal"));
    actualizarModoDestino();
    actualizarConsejoCanal();
    ocultarResultado();
    cambiarModulo("generador");
    // Si falta canal comienza en el Paso 1; si ya está, revisa ruta en el Paso 2.
    irAlPaso(channel ? 2 : 1,true);
    const notice=el("wizardValidation");
    if(notice){notice.className="wizard-validation assistant-import-notice";notice.textContent="✦ El asistente cargó una propuesta. Revisa las rutas del Paso 2, continúa a Medición y genera tu enlace. Ningún enlace se ha publicado.";}
  }
  function setup(){
    document.querySelectorAll("[data-assistant-example]").forEach(b=>b.addEventListener("click",()=>{
      set("assistantRequest",EXAMPLES[b.dataset.assistantExample]);
      el("assistantRequest").focus();
      resetError();
    }));
    el("assistantRequest")?.addEventListener("keydown",(event)=>{
      if((event.metaKey||event.ctrlKey)&&event.key==="Enter") interpretUi();
    });
  }
  window.interpretarSolicitudAsistente=interpretUi;
  window.revisarSolicitudAsistente=review;
  window.cambiarProductoAsistente=changeProduct;
  window.aplicarSolicitudAsistente=apply;
  setup();
})();
