# Revisión de calidad · v3.1

## Problema corregido

- En la versión anterior, la regla CSS global `input { width:100% }` se aplicaba a los botones de opción (radio) del asistente y empujaba los textos fuera de las tarjetas.
- Se establecieron dimensiones explícitas para los radios y límites de ancho al contenido flexible. El diseño usa 2 columnas en escritorio y 1 en pantallas estrechas.
- Se retiraron de la interfaz los botones prefijados para Gratificación / Open Market y el ejemplo «Soy cliente → Para ti». Ya no aparecen como acciones especiales ni en la guía del usuario.
- Los ejemplos de campaña de las sugerencias se hicieron genéricos. Los catálogos `productos.json`, `rutas.json` y `campanas.json` no se modificaron.

## Verificaciones locales realizadas

- `node --check app.js` sin errores.
- `node PRUEBAS_AUTOMATICAS_V3.js`: **17 casos aprobados** de URL web, deeplink, enlace combinado, UTM, `source`, `detail`, rutas especiales y cliente/no cliente.
- Chromium, con HTML/CSS/JavaScript de esta entrega y JSON locales simulados: **5 tamaños de pantalla:** 1625, 1366, 768, 390 y 320 px.
- Se comprobó con medidas de los elementos que los cuatro textos y sus controles permanecen dentro de cada tarjeta, sin desplazamiento horizontal ni desbordamiento.
- Interacción GUI: Meta Ads con UTM, enlace combinado con `embeddedURL`, navegación interna sin UTM con `source` y `detail`, y modalidad «Clientes / No clientes» con copia final bloqueada.
- Cero errores de JavaScript en los escenarios comprobados.

## Pendiente de validación en el banco

Las comprobaciones locales **no prueban** el inicio de sesión real, la apertura de App desde campañas, la aceptación de parámetros por Open Market, la instrumentación GA4/Firebase ni el fallback cliente/no cliente. Antes de usar un enlace en producción, probarlo en su canal y dispositivo reales.
