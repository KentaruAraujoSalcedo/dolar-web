# Generador de Links Marketing v3.1 — Scotiabank

**Qué es:** una herramienta de creación y revisión de URL, UTM y deeplinks para Marketing y Digital Analytics. Esta versión conserva los catálogos, generador masivo, analizador y probador de la v2.1 y añade un **asistente guiado de cuatro pasos**, ayudas por canal y una ficha de requisitos para Tecnología.

> **Importante:** el generador construye enlaces; **no valida** que el sitio de Scotiabank, la App, el login o GA4 los interpreten. Tampoco detecta instalación de App ni si la persona es cliente. Los flujos pendientes se señalan expresamente.

## Cómo abrirlo

1. Descomprime el ZIP y conserva los archivos en **la misma carpeta**.
2. Publícalos en un servidor web HTTPS **interno autorizado**. Abre `index.html` o `deep.html`.
3. Para pruebas locales, abre una terminal dentro de la carpeta y ejecuta `python -m http.server 8000`. Visita `http://localhost:8000/`.
4. **No abras `deep.html` con doble clic** (`file://`): el navegador puede bloquear la lectura de los JSON locales (`fetch`).
5. Al comenzar, comprueba que la barra azul indique que se cargaron los productos, las rutas y las fuentes de campaña.

No hace falta instalar frameworks ni paquetes para usar la herramienta en un servidor web. El script de pruebas automatizadas sí necesita Node.js.

## Guía de uso para Marketing — cuatro pasos

**Paso 1: Uso y objetivo.** Elige dónde se compartirá el enlace (Meta Ads, Google Ads, email, SMS, WhatsApp, push, QR o una página interna del banco). Después indica qué quieres que haga: Solo Web; Solo App; App instalada / Login Web; o Clientes / No clientes (propuesta futura). El asistente sugiere la configuración técnica.

**Paso 2: Destino.** Selecciona un producto del catálogo o escribe la URL Web y el deeplink App. Si eliges Solo Web, no necesitas App; si eliges Solo App, no necesitas Web. En **Clientes / No clientes**, también se habilita un campo para la landing pública de no clientes: se exporta en una ficha técnica, no dentro de un supuesto enlace inteligente.

**Paso 3: Medición.** Revisa `utm_source`, `utm_medium` y `utm_campaign` para campañas externas. `utm_content` (pieza/creativo) y `utm_term` (palabra clave u otra taxonomía aprobada) son opcionales. En enlaces internos, usa **sin UTM**, con `detail` y `source=campaign` opcional si el destino lo admite. Los parámetros `source` y `detail` **no son UTM**.

**Paso 4: Resultado.** Presiona **Generar link**, revisa la URL, copia y prueba en el canal y dispositivo que usarán los clientes. En el modo de integración futura, el resultado se marca **NO PUBLICAR** y permite copiar o descargar la **ficha JSON para Tecnología**.

Consulta `GUIA_RAPIDA_MARKETING.md` para ejemplos concretos que puedes compartir con el equipo.

## Diferencias entre las cuatro modalidades

| Modalidad | Enlace generado | Condición y advertencia |
|---|---|---|
| Solo Web | URL HTTP(S) directa, sin `embeddedURL` | Útil para landings, Open Market y login web. |
| Solo App | Deeplink `scotiabankpe:///...` con parámetros opcionales | Sin App, o en canales que bloquean esquemas privados, **no hay fallback asegurado**. |
| App instalada / Login Web | URL Web con `redirectTo` y `embeddedURL` codificado una vez | Puede abrir App si el sitio y el dispositivo lo soportan; si no, puede continuar al login web. **Se debe validar**. |
| Clientes / No clientes | Enlace candidato de clientes + landing pública separada + ficha JSON | **NO PUBLICAR** como inteligente. Clasificar clientes y hacer fallback requiere integración de Tecnología. |

**No confundir:** no tener App instalada **no equivale** a no ser cliente. Un cliente puede entrar por web desde un equipo sin App.

## Cómo se sugieren las UTM

Las sugerencias se basan en los valores de `campanas.json` **del proyecto recibido**, y son editables. No constituyen una nueva convención de Analytics ni deben imponerse a campañas con etiquetado ya aprobado.

| Uso | `utm_source` sugerido | `utm_medium` sugerido | Nota |
|---|---|---|---|
| Meta Ads | `meta` | `paid-social` | `utm_content` puede diferenciar video y pieza. |
| Google Ads | `google` | `paid-cpc` | Verificar autoetiquetado e integración con GA4. |
| Email/CRM | `masterbase` | `email` | Si el envío usa Epsilon, seleccionar `epsilon`/`email`. |
| TikTok Ads | `tiktok` | `paid-social` | Usar nomenclatura existente para campaña y pieza. |
| WhatsApp | `whatsapp` | `link` | Revisar si se trata de CRM, tráfico orgánico o pauta. |
| SMS | `sms` | `sms` | Identificar envío. |
| Push | `firebase` | `push` | Verificar atribución e instrumentación en App. |
| QR físico | `folleto-fisico` | `qr` | Preferir URL HTTPS que funcione desde la cámara. |
| Botón dentro del banco | *sin UTM* | *sin UTM* | Si aplica, `detail` para identificar el botón. |

`utm_campaign`: código que permita reconocer la campaña, producto, formato y período según la convención vigente. `utm_content`: opcional para anuncio/creativo. `utm_term`: opcional y solo si el equipo lo emplea con una definición consistente. No incluir datos personales en parámetros.

## Casos de ejemplo para QA

**1. CTA interno → una página web:** elige «Dentro de la web del banco» y «Abrir una página web». En Paso 2 busca el destino en el catálogo o pega una URL HTTPS. En Paso 3 utiliza **sin UTM** y `detail` solo si el destino lo admite. **No existe un preset para una campaña puntual**.

**2. Meta Ads → landing Web:** selecciona Meta y Solo Web, pega la landing HTTPS, revisa `utm_source` y `utm_medium` y completa `utm_campaign`. `utm_content` distingue anuncios de la misma campaña.

**3. Email → App / Login Web:** selecciona Email y «Abrir App o login Web». Ingresa rutas aprobadas. Un correo no ejecuta GTM; que la App se abra depende de las capacidades del enlace, navegador, dispositivo y configuración del banco.

**4. Clientes / No clientes:** selecciona la opción futura, proporciona las rutas del cliente y la landing pública del no cliente. Genera y descarga la ficha `requerimiento-clientes-no-clientes.json`. La detección y redirección reales deben implementarse en Tecnología; el generador **no agrega un `fallbackURL` ficticio**.

## Qué funciona y qué queda pendiente

**Construcción local:** creación de URL, inserción de UTM, `source` y `detail` en Web/App, limpieza de UTM heredadas, `embeddedURL` una sola vez, preservación de parámetros funcionales y rutas especiales y exportación masiva CSV con `utm_content`.

**Depende de sistemas externos:** apertura efectiva de App, login, soporte de Universal Links/Android App Links, fallbacks reales, tratamiento de `source`/`detail` por Open Market y la App, clasificación cliente/no cliente, instrumentación GA4/Firebase y exportación a BigQuery.

## Checklist antes de publicar

- [ ] Los destinos Web y App son los correctos y están autorizados.
- [ ] UTM de campaña externa correctas; sin UTM en navegación interna.
- [ ] `utm_content`, `utm_term` y `detail` no contienen información personal.
- [ ] Verificado `source=campaign` cuando aplica; Open Market acepta los parámetros.
- [ ] El enlace combinado se probó con y sin App, con y sin sesión, iPhone y Android cuando corresponda.
- [ ] Desde email/QR se probó el enlace **en ese canal**, no solo pegándolo en el navegador.
- [ ] Los parámetros que Analytics espera están realmente presentes en los eventos y tablas correspondientes.
- [ ] La modalidad Clientes / No clientes **NO se publica** hasta integración y aceptación por Tecnología.

## Archivos del ZIP

- `index.html`: entrada que redirige a `deep.html`.
- `deep.html`: interfaz de Marketing y módulos originales.
- `styles.css`: diseño responsive y componentes guiados.
- `app.js`: lógica del generador y validación de campos.
- `productos.json`, `rutas.json`, `campanas.json`: catálogos **sin alterar**.
- `GUIA_RAPIDA_MARKETING.md`: ejemplos para personas no técnicas.
- `REQUISITOS_TECNOLOGIA.md`: contrato esperado para el fallback por tipo de cliente.
- `PRUEBAS_AUTOMATICAS_V3.js`: pruebas Node.js sin conexiones externas; ejecutar `node PRUEBAS_AUTOMATICAS_V3.js`.

### Alcance de las pruebas de esta entrega

Se ejecutaron **17 pruebas de lógica** con Node.js y comprobaciones visuales/de interacción con Chromium a diferentes anchos de pantalla (320–1625 px). La prueba visual cargó el HTML, CSS y JavaScript de la entrega y simuló respuestas locales de sus tres archivos JSON para evitar conexiones externas. Las URLs generadas, el estado de los botones y el contenido de las tarjetas se verificaron con aserciones. No se evaluaron servidores ni dispositivos físicos del banco, comportamiento de autenticación, apertura real de la App ni eventos GA4; esos aspectos requieren QA en el ambiente autorizado.
