# Requisitos pendientes de Tecnología · Generador Marketing v3.4

El generador puede construir un enlace Web + App con `embeddedURL` y guardar por separado los destinos de cliente y no cliente. **No controla el comportamiento del login ni detecta la instalación de la App.**

## Comportamiento que sí se puede probar

- Web directa: URL HTTPS configurada por Marketing.
- App: `scotiabankpe:///...` (nativo), `.../webView?path=/u/...` (WebView), `.../browser?url=...` (Browser).
- Web + App: enlace HTTPS con `embeddedURL` que intenta abrir el deeplink en los sistemas compatibles.

En producción se debe validar cada destino en dispositivos reales, navegadores y aplicaciones de correo.

## Enrutamiento Clientes / No clientes (aún no funcional)

**Se requiere un punto de entrada HTTPS o solución de enrutamiento autorizada** que pueda distinguir un cliente autenticado/identificado de un no cliente de forma segura, y aplicar los destinos correspondientes. Estar sin App no implica no ser cliente. Hasta que exista este mecanismo, el generador mantiene bloqueada la copia de la modalidad como link publicable y exporta una ficha técnica con las rutas.

## App Links / Universal Links y fallback

Solicitar al equipo móvil/web que confirme los enlaces HTTPS asociados al dominio, los `assetlinks.json` / `apple-app-site-association` (según plataforma), el enrutamiento en Android/iOS y los destinos públicos de fallback. Debe probarse desde email, navegadores, QR y landings.

## Analytics

Confirmar si las rutas admiten `source`, `detail`, `cliente` y `utm_canal`, si estos parámetros son conservados a través del login y las WebViews, y qué eventos de GA4/Firebase/BigQuery los recogen. No es recomendable incluir datos personales en parámetros URL.

## Asistente de enlaces

La v3.4 es completamente estática; **no solicita acceso a servicios LLM** ni expone claves. Si alguna vez se incorpora Gemini u OpenAI, deberá existir un backend autorizado, gestión de secretos y revisión de privacidad y seguridad antes de usarlo con material corporativo.
