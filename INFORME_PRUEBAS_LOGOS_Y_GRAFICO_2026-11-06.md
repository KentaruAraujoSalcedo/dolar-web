# Informe técnico · Logos laterales y SUNAT a todo el ancho

Fecha: 6 de noviembre de 2026

## Alcance

**Modificados:** `index.html`, `css/home-market-refresh.css`, `scripts/home-redesign.js`.

**No modificados:** código de Cloudflare, scrapers, módulos de conversión, ranking, URLs de las casas, páginas internas ni configuración de publicidad.

## Validación

- Comparación SHA-256 contra el ZIP de entrada: los 225 archivos originales están presentes; exactamente tres tienen contenido modificado deliberadamente.
- 23 archivos HTML conservados; un solo H1 en la portada; sin IDs HTML duplicados; JSON-LD de la portada válido.
- Revisión de sintaxis de todos los JavaScript con `node --check`.
- Prueba de navegador **aislada** con CSS y funciones de la portada en 15 anchos: 320, 340, 360, 375, 390, 430, 500, 600, 768, 900, 1024, 1170, 1366, 1600 y 1920 píxeles, sin desbordamiento horizontal.
- Se verificaron logos y enlaces de las mejores tasas, seis puntos de histórico, SVG visible, distribución horizontal del logo y el texto, y la adaptación del gráfico al cambiar de anchura.
- Se verificó el selector «Hoy / Mes actual» y la ausencia de curva falsa en el caso sin histórico.

## Limitación

El navegador bloqueó la navegación a una URL local (`ERR_BLOCKED_BY_ADMINISTRATOR`), incluso al intentar interceptar todas sus peticiones. Por tanto, **no se pudo ejecutar una prueba de extremo a extremo** con la web completa ni con el Worker en producción. Las pruebas visuales utilizaron datos simulados; deben repetirse las comprobaciones funcionales en el dominio después de desplegar.

## Nota sobre los datos

La API `/sunat-mensual` ofrece los registros del mes. Si el mes apenas comenzó y hay seis días, la línea aprovecha el ancho para que esos seis datos sean legibles, sin rellenar días ni fabricar cotizaciones. La fecha del último registro se muestra explícitamente.
