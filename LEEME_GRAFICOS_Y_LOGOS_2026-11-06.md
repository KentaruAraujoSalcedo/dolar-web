# PrecioDolarHoy — actualización de gráficos y logos

Se conservan las páginas y funcionalidades originales. Cambios puntuales en la portada:

- Logos enlazados en **Mejor compra** y **Mejor venta**, con alternativa de texto.
- Retirada de «Mejor opción para ti».
- Gráfico mensual SUNAT a mayor ancho y selector de períodos «Hoy / 30 días».
- «Hoy» indica claramente la ausencia de datos intradía, porque el scraper SUNAT publica valores diarios.
- Ancho y anuncios de la web sin modificaciones.

## Archivos de código cambiados

`index.html`, `scripts/ui/bestHeader.js`, `scripts/data.js`, `scripts/home-redesign.js`, `scripts/main.js` y el nuevo `css/home-market-refresh.css`.

## Para publicar

Usa una rama Git nueva. Copia solamente los archivos del ZIP de cambios, revisa `git status --short` y agrega las rutas explícitamente. No borres `.git` ni incluyas cambios de `generador/`. Las pruebas de producción con la API real siguen pendientes.
