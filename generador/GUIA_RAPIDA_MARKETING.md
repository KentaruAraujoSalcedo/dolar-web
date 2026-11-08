# Guía rápida para Marketing · Generador de Links v3.4

## Empieza por «Asistente de enlaces» (gratuito)

1. Abre el generador y selecciona **Asistente de enlaces**. Si prefieres hacerlo manual, conserva la pestaña **Crear enlace**.
2. Explica qué necesitas. Por ejemplo: «Voy a enviar un correo de Masterbase a Para ti. Si tiene App, que abra Para ti; si no, login web. utm_campaign=beneficios_noviembre_tactica_conversion y detail=boton_principal».
3. Presiona **Interpretar solicitud**. El asistente propone el canal, modalidad, producto y parámetros que reconoció.
4. Lee **Esto entendí de tu solicitud**. Puedes editar el canal, el tipo de enlace, el destino y la medición. Si muestra datos pendientes, complétalos.
5. Presiona **Aplicar al generador**. Esto **no publica ni copia** ningún enlace: llena el generador de cuatro pasos.
6. En **Paso 2 · Destino**, comprueba las rutas Web y App. En **Paso 3 · Medición**, revisa `utm_source`, `utm_medium`, `utm_campaign` y los extras. En **Paso 4 · Resultado**, presiona **Generar enlace** y copia el resultado si es publicable.
7. Prueba el enlace en el canal real (correo, web, app, etc.) antes de enviarlo a clientes.

El asistente **no usa una IA generativa**. Funciona con reglas de JavaScript en el navegador y los archivos locales del proyecto. No existe una API de Gemini/OpenAI ni se cobran consultas. Para tareas ambiguas, te pedirá editar o completar los datos.

## Cuatro ejemplos listos para practicar

- **Meta + Para ti**: interpreta un enlace combinado Web/App, busca «Para ti» en el catálogo, sugiere `meta / paid-social` y conserva `utm_campaign` y `detail`.
- **Botón interno sin UTM**: reconoce navegación interna, propone Solo Web y conserva `source` y `detail` sin crear UTM de atribución.
- **Ruta WebView**: al pegar `/u/term/term-deposit/close/init`, puede construir **como propuesta de formato** la URL `login?redirectTo=...` y el deeplink `scotiabankpe:///webView?path=...`.
- **Clientes / No clientes**: prepara la ficha de destinos pero **bloquea su publicación**; hace falta una solución de Tecnología para distinguir personas y aplicar el fallback.

## ¿Qué son las tres rutas de App?

| Tipo | Formato | Cuándo usarlo |
|---|---|---|
| Nativo | `scotiabankpe:///exchange` | Pantalla nativa aprobada por el banco. |
| WebView | `scotiabankpe:///webView?path=/u/...` | Ruta interna del banco, solo si la App la admite. |
| Browser | `scotiabankpe:///browser?url=...` | URL HTTPS que la App recibe en el parámetro `url`. |

**Importante:** no toda ruta que empieza por `/u/` es válida en la App. El asistente crea el *formato* y nunca confirma que el destino esté operativo.

## ¿Qué agrego para medir?

En campañas externas se recomiendan `utm_source`, `utm_medium`, `utm_campaign` y, si corresponde, `utm_content` y `utm_term`. Puedes construir el nombre de campaña mediante `producto_campaña_tipo_objetivo` o escribirlo manualmente.

`source`, `detail`, `cliente` y `utm_canal` son **parámetros personalizados**. Pueden agregarse sin UTM para botones internos; **no** los convierte automáticamente en dimensiones de GA4. En Web, su presencia puede revisarse en `page_location` del evento de página si la implementación captura la URL. Para informes como dimensiones, Analytics debe recogerlos como parámetros de evento y registrarlos en GA4. En App deben enviarlos los eventos de Firebase/GA4.

## Antes de publicar (lista de verificación)

- ¿La URL Web abre la pantalla esperada? ¿Se respeta la sesión si pasa por login?
- ¿El deeplink abre la App tanto en Android como en iPhone?
- ¿Se comprobó el comportamiento **sin App instalada**? `embeddedURL` no garantiza fallback.
- ¿Se evitó poner UTM en botones internos que cambien la atribución de adquisición?
- ¿No hay datos personales (DNI, teléfono, correo privado o tokens) en URLs?
- ¿Los parámetros personalizados realmente llegan a la medición de Analytics?

**No publiques** la modalidad Clientes / No clientes hasta que Tecnología implemente y valide la selección automática del destino.

## ¿Cómo abrir el proyecto?

Descomprime el ZIP y ejecuta un servidor web local desde la carpeta del proyecto, por ejemplo `python -m http.server 8000`, y abre `http://localhost:8000/`. La única página de entrada es `index.html`. No abras el HTML con doble clic porque los catálogos JSON pueden quedar bloqueados desde `file://`.

## Si escribes «no tenga UTMs» o «compra de deuda»

El asistente debe reconocer que **no quieres ninguna UTM** aunque lo escribas como «no tenga UTMs», «que no lleve UTM» o «sin UTM». «Compra de deuda» se busca en el catálogo y sugiere **Compra de Deuda Extra Línea**. **Confirma el producto antes de generar** para evitar enviar usuarios a una ruta incorrecta. El equipo de Analytics puede ampliar los nombres alternativos agregando `sinonimos` a un producto en `productos.json`.

Si el navegador sigue mostrando un comportamiento anterior, abre la versión 3.4.2 y recarga forzadamente la página (Ctrl + Shift + R).
