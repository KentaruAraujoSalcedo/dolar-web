# Generador de Links Marketing v3.3 · Scotiabank

Herramienta para **crear y revisar URLs Web, deeplinks App y enlaces combinados**. Se actualizó a partir de la versión v3.2 del equipo. Es una aplicación local sin servicios de acortamiento ni verificación de cuenta; **no detecta por sí sola si una persona instaló la App o si es cliente**.

## Abrir el proyecto

1. Descomprime el ZIP **completo**, manteniendo los archivos juntos.
2. Abre una terminal dentro de la carpeta descomprimida y ejecuta `python -m http.server 8000` (con Python instalado; también se puede usar un servidor HTTP interno de tu organización).
3. Abre `http://localhost:8000` en Chrome, Edge o el navegador aprobado por Tecnología. **El archivo principal es `index.html`**. No existe `deep.html`.
4. Comprueba la franja superior: debe indicar que se cargaron `productos.json`, `rutas.json` y `campanas.json`. Si abres con `file://` o con doble clic, el navegador puede bloquear la carga de JSON.

Archivos principales: `index.html`, `styles.css`, `app.js`, `productos.json`, `rutas.json`, `campanas.json`. Los catálogos del proyecto original se han conservado. Las guías y pruebas se incluyen como documentación auxiliar.

## Recorrido para Marketing

**Paso 1. Uso y objetivo:** elige dónde enviarás el enlace (Meta, Google Ads, Email/CRM, SMS, etc.) y qué quieres abrir: Solo Web, Solo App, Web + App o Clientes / No clientes (solo propuesta). Las sugerencias son editables y provienen del catálogo `campanas.json` cuando corresponda.

**Paso 2. Destino:** solo aparecen los campos necesarios para el objetivo seleccionado. Puedes pegar una URL completa, buscarla en **Catálogo** o convertir una ruta desde el campo rápido. Este campo admite tres formatos:

- **Nativo:** `exchange` → `scotiabankpe:///exchange`.
- **WebView:** `/u/campaign;code=CF` → `scotiabankpe:///webView?path=/u/campaign;code=CF` y propone la URL de login web `https://mi.scotiabank.com.pe/login?redirectTo=/u/campaign;code=CF`.
- **Browser:** `https://www.scotiabank.com.pe/personas/...` → `scotiabankpe:///browser?url=` seguido de la página codificada como componente URL. La opción Browser también se encuentra en **Configurar destino**.

Nativo no tiene una URL Web deducible automáticamente; para «Web + App» completa el destino Web por separado. Generar un formato no significa que la App soporte esa ruta: solicita QA en Android y iOS.

**Paso 3. Medición:** si el canal es externo, el asistente sugiere `utm_source` y `utm_medium`. Para `utm_campaign`, elige entre:

- **Construir con 4 campos**: `producto_campaña_tipo_objetivo`. Ejemplo: `tc_comprasexterior-millas_tactica_conversion`. Los espacios pasan a `_` y los componentes se convierten a minúsculas.
- **Escribir nombre completo**: acepta cualquier nombre que escribas; no lo transforma a minúsculas.

`utm_content` y `utm_term` siguen siendo opcionales. Los campos `source`, `detail`, `cliente`, `utm_canal` y los parámetros adicionales también son opcionales y **no cambian tus UTM estándar**. Es posible indicar si los extras van a Web, App o ambos. No incluir datos personales o información sensible en las URLs. Para botones internos, se recomienda **sin UTM**, y puedes incluir extras solo si tu equipo de medición los requiere.

**Paso 4. Resultado:** pulsa **Generar enlace** y el resultado aparece inmediatamente debajo. Puedes copiarlo, probar su apertura y consultar variantes técnicas. Las preguntas frecuentes están al final.

## Catálogo, constructor y verificaciones

- **Catálogo:** consulta los enlaces ya disponibles del inventario: URL Web, deeplink App y enlace base combinado, si aplica. También puedes cargar una ruta en el asistente para parametrizarla.
- **Configurar destino:** constructor separado para casos especiales, con Nativo, WebView y Browser. Al guardar regresa al Paso 2.
- **Analizar enlace:** muestra los parámetros recibidos. **Probar enlace** permite iniciar la navegación, pero no confirma autenticación o atribución en Analytics.
- **Varios canales:** conservado para autogeneración y CSV. Los parámetros extra se aplican también al lote según su destino elegido.

## Límites importantes

**Web + App:** genera una URL HTTPS con `embeddedURL` para un deeplink App. Esto no significa detección garantizada de instalación de la App. La lógica real de `/login`, el redireccionamiento y compatibilidad en navegadores/correos debe validarse en el banco.

**Clientes / No clientes:** permite definir destinos de cliente en Web/App y una landing para no clientes, pero **no es publicable**. La copia publicable queda deshabilitada y se genera una ficha de requerimientos para Tecnología. La instalación de la App no equivale a ser cliente.

**Browser:** las UTM y los extras de la App se agregan **dentro de la URL HTTPS** transportada en `browser?url=`, y después se codifica el valor interno. Tecnología debe confirmar que ese comportamiento es compatible con su implementación.

**GA4:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` y `utm_term` son parámetros de campaña reconocidos para la atribución manual; `source`, `detail`, `cliente` y `utm_canal` **no son dimensiones personalizadas automáticas**. En Web, pueden estar visibles dentro de `page_location` si la implementación captura la URL; para tenerlos como columnas/dimensiones separadas hay que instrumentarlos mediante GTM/GA4 o Firebase/App y verificar la exportación a BigQuery.

## Soporte

El proyecto incluye scripts de QA en la carpeta `qa/`. La revisión local verifica la construcción de URL y la interfaz; **no verifica servidores de Scotiabank, App Links/Universal Links ni el comportamiento real de GA4**.
