# Informe QA local · Generador v3.2

## Pruebas de construcción

**22 pruebas automatizadas aprobadas**, ejecutadas mediante Node.js sobre las funciones de generación. Incluyen: Web interna sin UTM, combinada con `embeddedURL` codificado una vez, Solo App, UTM de campañas, limpieza de parámetros antiguos, conservación de `redirectTo=/u/campaign;code=CD`, fragmentos de URL, ficha no-publicable y `source` personalizado en Web y App, con/sin UTM y con caracteres especiales.

Comando reproducible: `node PRUEBAS_AUTOMATICAS_V3_2.js`.

## Pruebas funcionales en Chromium

Se probó localmente la interfaz con los catálogos completos: **58 productos, 388 paths WebView, 29 deeplinks nativos, 17 fuentes de campaña**. Los JSON se sirvieron a la prueba desde archivos locales a través de un sustituto de `fetch` debido a las restricciones de red del entorno de pruebas.

Se verificó:

- Paso 1: aviso si falta elegir canal.
- Paso 2: aviso si falta URL Web para Solo Web/combinado, o deeplink App para Solo App/combinado.
- Paso 3: sugerencias de UTM por canal; `source` editable, vacío y personalizado; `detail` editable.
- Paso 4: URL final debajo del botón de generar, copia y vista previa; acceso a las preguntas frecuentes al final.
- Enlace Solo Web sin UTM, Solo App con UTM, Web + App con parámetros en ambos destinos.
- Navegación al catálogo, selección de producto y regreso al Paso 2.
- Constructor avanzado WebView guardando las rutas en el generador.
- Modalidad «Clientes / No clientes» con ficha técnica y bloqueo de copia publicable.
- Generación masiva por fuentes disponibles en el catálogo.

**Responsive:** se inspeccionaron las cinco pestañas a anchos 1440, 1280, 1024, 768, 390 y 320 px: **0 px de desplazamiento horizontal no deseado** y sin errores de JavaScript detectados en las pruebas.

## Limitaciones de QA

Estas son pruebas locales de construcción y visualización, no certificaciones del ecosistema Scotiabank. Queda pendiente verificar en dispositivos reales y sistemas del banco: apertura de App, compatibilidad `embeddedURL`, autenticación, fallback HTTPS, reconocimiento de `source`/`detail`, taxonomía GA4, comportamiento de campañas y registro en BigQuery.
