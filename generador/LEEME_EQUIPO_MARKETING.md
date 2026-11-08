# Generador de Links Marketing v3.4 · Scotiabank

**Versión:** 3.4 · **Tipo:** aplicación web estática sin servidor de IA, sin APIs externas de pago.

## Qué entrega este proyecto

El proyecto conserva el generador de enlaces Web, App y combinados, el catálogo de productos y rutas, el constructor avanzado de destinos, el analizador de URLs, el probador de deeplinks y el generador masivo. La v3.4 añade una pestaña **Asistente de enlaces** para que Marketing describa solicitudes en lenguaje natural y reciba una configuración editable que puede pasar al generador de cuatro pasos.

El asistente está hecho con reglas deterministas de JavaScript: reconoce canales, medios, destinos exactos del catálogo, URLs HTTPS, deeplinks `scotiabankpe:///`, algunas rutas `/u/...` y parámetros explícitos. **No es una IA generativa** ni necesita conectarse a Gemini, ChatGPT u otra plataforma. Cuando no identifica un destino, deja el campo vacío y solicita revisión. No envía la solicitud a servicios de terceros.

## Archivos

- `index.html`: **único punto de entrada** y estructura de las seis pestañas.
- `styles.css`: interfaz responsive y diseño del asistente.
- `app.js`: núcleo original de construcción, validación y análisis de URLs.
- `asistente.js`: nueva lógica de interpretación sin API; solo propone campos y llama al núcleo para construir la URL final.
- `productos.json`: destinos conocidos del banco.
- `rutas.json`: inventario de rutas nativas y WebView.
- `campanas.json`: convenciones existentes de fuentes y medios.
- `GUIA_RAPIDA_MARKETING.md`: instrucciones orientadas a usuarios de Marketing.
- `REQUISITOS_TECNOLOGIA.md`: qué falta para fallback web / App Links y el escenario clientes/no clientes.
- `QA_V3_4.md`: alcance de los controles automatizados.
- `qa/`: scripts de regresión y evidencias de interfaz.

## Inicio en local

Desde la carpeta descomprimida:

```bash
python -m http.server 8000
```

Después, abre `http://localhost:8000/` y selecciona **Asistente de enlaces**. También puedes utilizar el botón «Abrir asistente gratuito» que aparece sobre el proceso guiado de **Crear enlace**.

Se puede publicar en un hosting estático interno autorizado con HTTPS, siempre que `index.html`, los tres `.js/.css` y los JSON permanezcan accesibles en la misma carpeta. **No hace falta una API Key**. Si la organización usa una política CSP estricta, hay que revisar compatibilidad con los manejadores `onclick` existentes antes de publicar.

## Seguridad y límites

1. La aplicación no sabe realmente si un usuario tiene la App instalada ni si es cliente del banco.
2. La modalidad Web + App se construye con `embeddedURL`, pero no garantiza apertura ni fallback en todos los canales, sistemas o navegadores.
3. La modalidad Clientes / No clientes produce una ficha técnica y mantiene deshabilitada la copia como enlace publicable.
4. Las rutas del catálogo son propuestas disponibles en los JSON: su presencia no demuestra que sigan habilitadas en producción.
5. Los parámetros extra (como `source`, `detail`, `cliente`, `utm_canal`) no quedan registrados en GA4/Firebase sin instrumentación.
6. No introduzcas información personal ni datos bancarios sensibles en solicitudes o parámetros de enlaces.
7. El análisis de frases libres es deliberadamente conservador. Si una solicitud no coincide con una regla, el usuario debe completar los campos manualmente.

## Cómo actualizar catálogos

Gestiona los archivos JSON de acuerdo con los procesos internos de Analytics/Tecnología. No edites rutas para «forzar» la apertura de una pantalla si no se ha validado con la App. Las recomendaciones del asistente usan esos mismos archivos, por lo que no mantiene un segundo inventario de rutas.

## Recomendación de despliegue

Validar primero en un entorno de pruebas con usuarios de Marketing y QA de navegación real en iOS/Android, además de comprobar los eventos de Analytics. Los controles incluidos verifican la construcción y la interfaz, **no** los servidores o la App del banco.
