# Informe técnico de validaciones — PrecioDolarHoy.pe

**Fecha:** 5 de noviembre de 2026

## Alcance probado

- El proyecto final se construyó desde `PrecioDolarHoy_cabecera_compacta_completo_2026-11-05.zip`, la última entrega completa disponible.
- Reordenación de tres filas en la portada y actualización de la tasa seleccionada de la casa recomendada.
- Se conservaron los identificadores que usa el JavaScript y las páginas restantes.

## Comprobaciones

1. **Integridad del ZIP:** se comparan rutas y hashes SHA-256 con el ZIP base. Ningún archivo previo se elimina. Se verifica `ZipFile.testzip()` sin errores.
2. **JavaScript:** `node --check` sobre los módulos JavaScript. La función `renderBestDeal` se comprobó usando dos cotizaciones de ejemplo, alternando compra/venta, cuatro escenarios de cálculo y estado sin cotizaciones.
3. **Responsive:** se renderizó una vista previa aislada a **320, 360, 390, 600, 768, 900, 1024, 1100, 1366 y 1600 píxeles**. No se encontró desbordamiento horizontal. El gráfico se reubica debajo de recomendación y SUNAT en tamaños intermedios y los elementos se apilan en móvil.
4. **Anuncios:** la vista previa de escritorio conserva las cinco posiciones reservadas (dos por lado y una horizontal), sin presentarlas como anuncios activos.
5. **HTML y SEO:** se revisa que exista un único `h1`, el canonical, las secciones con IDs esperados, las referencias de recursos locales y los datos estructurados existentes.

**Datos de las capturas:** demostrativos. Las imágenes de vista previa no confirman cotizaciones reales, resultados financieros actuales ni disponibilidad de servicios externos.

## Limitaciones y comprobaciones pendientes

El navegador de este entorno bloqueó navegar al servidor de prueba local (`ERR_BLOCKED_BY_ADMINISTRATOR`). Para revisar la presentación se usó `page.set_content` con el HTML y CSS reales, imágenes incrustadas y datos de ejemplo. Se verificaron funciones JS por separado, **pero no fue posible una prueba integral del sitio consumiendo la API real de Cloudflare ni la publicación en GitHub Pages**.

Antes de publicar definitivamente: comprobar cotizaciones reales, conversión y modalidades, enlaces, logo de la mejor casa, gráfico y modales en el dominio publicado; realizar una recarga completa para evitar caché.

**Monetización:** los cambios no aseguran aprobación de AdSense ni de otra red de publicidad. No se habilitan campañas ni anuncios reales.
