# Generador de Links Marketing v3.2 · Scotiabank

## Inicio rápido

1. **Descomprime todo el ZIP**. Deja `deep.html`, `app.js`, `styles.css`, `productos.json`, `rutas.json` y `campanas.json` en la misma carpeta.
2. Abre la herramienta desde un **servidor web local o corporativo**; por seguridad del navegador, no abras el HTML con doble clic (`file://`), ya que puede bloquear la carga de los catálogos JSON.
3. Por ejemplo, si tienes Python instalado, abre una terminal en esa carpeta y ejecuta `python -m http.server 8000`. Entra a `http://localhost:8000` y se abrirá `deep.html`.
4. Verifica arriba el mensaje **«Configuración cargada»** antes de crear enlaces. No hace falta instalar paquetes ni conectarse a servicios de terceros.

## Diseño para Marketing

La pestaña **Crear enlace** tiene cuatro pasos y muestra solo **uno a la vez**. Los botones «Continuar» y «Volver» permiten avanzar, y el asistente avisa qué campo obligatorio falta.

**Paso 1: Uso y objetivo.** Elige el canal (Meta Ads, Google Ads, email, etc.) y el resultado deseado: Solo Web, Solo App, App o login Web, o Clientes/No clientes (propuesta técnica). El canal sugiere una configuración de UTM, pero puede editarse.

**Paso 2: Destino.** Pega una URL Web y/o un deeplink App. Si no sabes qué usar, pulsa **Buscar en el catálogo**. Si debes construir una ruta especial, abre **Configurar un destino nuevo**. Para Solo Web no hace falta App; para Solo App no hace falta URL Web; para combinado sí se necesitan ambos. La opción de clientes/no clientes requiere además la landing alternativa, pero **no implementa la detección de cliente**.

**Paso 3: Medición.** Revisa los campos sugeridos para `utm_source`, `utm_medium`, `utm_campaign`, y opcionalmente `utm_content` y `utm_term`. Para enlaces internos, elige una modalidad sin UTM. Los campos **`source` y `detail` son extras opcionales e independientes de las UTM**: basta con escribir el valor. Si `source` está vacío no se añade; si escribes, por ejemplo, `crm`, se agrega `source=crm`. Los parámetros se incorporan a Web y, cuando corresponde, al deeplink App. Esto no garantiza que el destino los procese ni que aparezcan en GA4/BigQuery.

**Paso 4: Resultado.** Pulsa **Generar enlace**. La URL aparece **inmediatamente debajo del botón**, con opciones de copiar y probar. Las preguntas frecuentes están después del resultado. Si eliges Clientes/No clientes, se muestra la ficha de requisitos para Tecnología y **se impide copiar el enlace como publicable**.

## Pestañas adicionales

- **Catálogo:** busca un producto o funcionalidad y consulta tres datos por separado: **URL Web**, **deeplink App** y **link base** (Solo Web o Web + App, sin UTM). Cada ruta puede copiarse. Usa **Usar este destino en el generador** para añadir medición. El link base Web + App es una construcción de referencia, **no una garantía de apertura de la App ni de fallback**.
- **Configurar destino:** constructor avanzado de rutas WebView y Nativas. Una vez elegido el destino, pulsa **Guardar rutas y volver al generador**: las rutas se rellenan en el Paso 2. Está separado del flujo principal para que Marketing no se distraiga con detalles técnicos.
- **Analizar enlace:** inspecciona parámetros, destino Web y deeplink embebido.
- **Probar enlace:** prepara la apertura de enlaces y deeplinks; el resultado real depende del dispositivo, navegador, App e infraestructura del banco.

## Decisiones de atribución

- **Campañas externas:** usa las UTM aprobadas por Analytics y respeta los nombres de `campanas.json`. `utm_content` distingue creatividades; `utm_term` se usa solo si corresponde a la convención.
- **Botones dentro del banco:** evita generar nuevas UTM porque pueden cambiar la atribución de sesión. Puedes añadir `source` y `detail`, si el destino los admite.
- **No confundas `source` con `utm_source`:** son parámetros distintos. Editar `source` desde el asistente no cambia el valor de `utm_source`.

## Lo que la herramienta NO hace automáticamente

No detecta si una App está instalada; no autentica ni distingue a clientes y no clientes; no instala Android App Links/iOS Universal Links; no verifica que `/login` procese `embeddedURL`; no comprueba el registro de parámetros en GA4/Firebase/BigQuery. Esas condiciones requieren pruebas o integración con los equipos de Web, App y Tecnología.

## Control de calidad y archivos

Los archivos de catálogo originales (`productos.json`, `rutas.json`, `campanas.json`) se conservan. Las pruebas locales automatizadas están en `PRUEBAS_AUTOMATICAS_V3_2.js`: ejecuta `node PRUEBAS_AUTOMATICAS_V3_2.js`. Consulta `QA_V3_2.md` para alcance y límites de la validación.
