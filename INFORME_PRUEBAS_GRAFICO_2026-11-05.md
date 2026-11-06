# Informe de validación — SUNAT y refinamiento visual

## Hallazgo y corrección

Se reprodujo el defecto del gráfico anterior: tras crear los elementos SVG, `svg.hidden = false` no eliminaba el atributo `hidden` del elemento SVG en Chromium. La regla CSS `#trend-svg[hidden] { display: none !important; }` mantenía el gráfico invisible. Se reemplazó por `svg.removeAttribute('hidden')` y se usa `svg.setAttribute('hidden', '')` al no disponer de historial. La visibilidad del mensaje sin datos se restablece expresamente.

## Verificaciones completadas

- Comparación con el ZIP previo: todos sus archivos están presentes, sin eliminar ninguno.
- Sintaxis: todos los JavaScript revisados con `node --check`; CSS nuevo parseado; HTML con un único H1 e IDs no duplicados.
- Vista previa aislada en Chromium con histórico SUNAT simulado: SVG visible, con geometría y puntos dibujados.
- Estado sin datos históricos: SVG oculto y mensaje explicativo visible.
- Responsive: anchos **320, 350, 375, 390, 430, 600, 640, 768, 900, 950, 1024, 1160, 1280, 1366, 1600 y 1920 px**, sin desbordamiento horizontal.
- Cotizaciones de compra/venta más compactas, recomendación con logo centrado, cifras SUNAT junto al encabezado y gráfico a todo el ancho.
- Previsualización: cuatro posiciones laterales y una horizontal disponibles en modo de demostración; ocultas por defecto si están vacías.

## No verificado aún

- Respuesta actual de la API real y su disponibilidad en producción.
- Comportamiento de posibles bloqueadores de scripts, extensiones del navegador y caché de Cloudflare de usuarios finales.
- Auditoría de aprobación de AdSense: el diseño no garantiza aprobación.

**Importante**: los valores mostrados en las capturas de prueba son ilustrativos, no cotizaciones en vivo.
