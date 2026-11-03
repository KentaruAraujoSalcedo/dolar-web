# Generador de Links Web y App — versión 2.0

Herramienta estática para el equipo de Marketing y Digital Analytics. Permite generar URLs de campaña y enlaces de navegación interna, reutilizando el catálogo de destinos Web, WebView y App.

## Cómo ponerlo en funcionamiento

Mantén **todos los archivos del ZIP en la misma carpeta**, y publícalos en un servidor HTTPS interno autorizado. La entrada principal es `deep.html` (también se puede ingresar por `index.html`). Para comprobarlo localmente, desde la carpeta ejecuta:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000/` en el navegador. No abras el HTML directamente mediante doble clic: los navegadores suelen impedir la lectura de los archivos JSON con `fetch` cuando la página se ejecuta desde `file://`.

## Flujo de uso

1. **Paso 1 — Destino:** selecciona una ruta del catálogo o escribe la URL Web y, cuando corresponda, el deeplink App.
2. **Paso 2 — Medición:** elige una de estas opciones:
   - **Campaña externa — con UTM:** exige `utm_source`, `utm_medium` y `utm_campaign`; `utm_term` y `detail` son opcionales. Añade `source=campaign`.
   - **Navegación interna — sin UTM:** elimina las UTM previas y `source=campaign`, sin obligar a completar datos de campaña. Puedes escribir `detail` si tu equipo lo tiene instrumentado.
3. **Formato:** usa **Web + App** cuando el destino necesita `embeddedURL`, o **Solo Web** para URLs HTTPS directas que no necesitan deeplink.
4. **Paso 3 — Generación:** genera un enlace, cópialo y pruébalo. La generación masiva por canales solo aplica al modo de campaña.

## Comportamiento de los parámetros

| Parámetro | Campaña externa | Navegación interna |
|---|---|---|
| `utm_source`, `utm_medium`, `utm_campaign` | Obligatorios | Se eliminan |
| `utm_term` | Opcional | Se elimina |
| Otras UTM preexistentes, como `utm_content` | Se eliminan para evitar arrastres | Se eliminan |
| `source=campaign` | Se agrega | Se elimina si estaba presente |
| `detail` | Opcional | Opcional |
| `_gl` presente en URL pegada | Se elimina: es un identificador temporal | Se elimina |
| `redirectTo`, `path` y demás parámetros técnicos | Se conservan | Se conservan |
| `embeddedURL` | Se construye en modo Web + App | Se construye en modo Web + App |

**Importante:** Si marcas **Solo Web**, no se añade `embeddedURL`, aunque el enlace original lo trajera. No uses este formato en flujos que dependan de `embeddedURL` (como un login que redirige a una pantalla App).

Si ya pegas una URL Web con `embeddedURL` y no ingresas App en el Paso 1, el modo **Web + App** recupera ese deeplink, lo limpia y vuelve a codificarlo correctamente.

## Ejemplo práctico — botón interno de Gratificación

Un CTA a una página Web de Open Market puede generarse en **Navegación interna / Solo Web**. No agrega UTMs. Si la implementación del destino lo soporta, se puede usar un `detail` como `landing_gratificacion_cuenta_sueldo` para distinguir el clic. Esto **no garantiza** que se registre el dato o la apertura exitosa en GA4/BigQuery.

Para el CTA de Depósito a Plazo que usa `/login?embeddedURL=...`, selecciona **Web + App**. Comprueba el flujo con y sin app instalada, además de usuarios con y sin sesión iniciada; un enlace válido por su estructura no garantiza el comportamiento del móvil o del login.

## Verificaciones antes de distribuir un enlace

- [ ] El destino y sus rutas corresponden al producto correcto.
- [ ] El link de adquisición externa tiene UTMs correctas; los CTAs internos no llevan UTMs.
- [ ] `source=campaign` solo aparece en enlaces de campaña.
- [ ] `detail` y `utm_term` solo contienen identificadores **no personales**.
- [ ] Se probó en escritorio y móvil; para deeplinks, se probó con/sin App instalada, Android/iOS cuando aplique, y con/sin login.
- [ ] Se validó en GTM, GA4 DebugView y/o BigQuery la recepción de los parámetros pertinentes; **ponerlos en la URL no implica capturarlos**.
- [ ] Se verificó que un clic interno no cree una campaña nueva ni altere inesperadamente la atribución de sesión en GA4.

## Archivos

- `deep.html`: interfaz principal; `index.html`: acceso por la raíz.
- `app.js`: generación, análisis y comprobación de enlaces.
- `styles.css`: diseño y adaptación móvil.
- `productos.json`, `rutas.json`, `campanas.json`: configuración original del catálogo y fuentes.

## Limitaciones

Esta herramienta **construye y revisa URLs**, pero no valida la elegibilidad de clientes, el éxito de una apertura, el manejo real de deep links, ni la continuidad de atribución entre Web, Open Market y App. Esto debe probarse con los equipos responsables y los eventos instrumentados. No agregues contraseñas, tokens de sesión ni datos personales a los enlaces.

### Pruebas automáticas realizadas en la entrega

Se comprobaron en un navegador de pruebas: carga del catálogo de 58 productos, generación interna Solo Web, limpieza de parámetros arrastrados, `detail` opcional, modo Web + App con `embeddedURL` existente, modo campaña con `utm_term`, analizador, autogenerador multicanal, exportación CSV, reinicio del formulario, rutas WebView distintas y visualización adaptable a móvil. No se enviaron peticiones a sistemas reales de Scotiabank.
