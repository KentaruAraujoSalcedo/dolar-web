# PrecioDolarHoy.pe — Actualización de la tercera fila

Esta entrega se ha creado sobre `PrecioDolarHoy_distribucion_final_completo_2026-11-05.zip`. Conserva todos los archivos originales de esa entrega.

## Cambios concretos

- **Mejor opción para ti:** tarjeta aproximadamente 35 % del ancho, con una sola marca visual (logo o nombre de respaldo), borde lima discreto, tasa relevante según la operación, comparación SUNAT si hay datos, botón de salida y aclaración informativa.
- **SUNAT + evolución:** una sola tarjeta que muestra compra y venta de referencia junto al gráfico real de SUNAT. En escritorio, las dos tasas aparecen en una columna lateral; en móviles, arriba del gráfico.
- **Diseño adaptable:** los dos paneles quedan uno junto al otro en escritorio y se apilan en pantallas estrechas.
- **Compatibilidad:** se conservan los IDs del JavaScript, los enlaces, modales, los cinco espacios publicitarios preparados y las páginas SEO. No se ha cambiado Cloudflare ni ningún scraper.

## Archivos de código que debes copiar

1. `index.html` — sustituir el existente.
2. `css/home-reference-unified.css` — añadir el nuevo CSS.

**No borres carpetas ni la carpeta `.git`.** La entrega completa es útil como respaldo, pero para tu repositorio GitHub se recomienda el paquete de solo cambios. No ejecutes `git add .` si tienes otros cambios locales como eliminaciones en `generador/`.

## Publicación segura

Antes de copiar los archivos, comprueba `git status` y utiliza una rama nueva desde la última `main` que tengas actualizada. Copia solo los dos archivos de código mencionados y añade este documento si quieres.

Después de publicar, confirma con la API real que la casa recomendada cambie al alternar entre comprar/vender, que las tasas SUNAT se actualicen, que el gráfico no muestre datos simulados y que los modales y enlaces funcionen.

**Publicidad:** las posiciones permanecen como reservas ocultas mientras no tengan unidades reales aprobadas. El diseño no garantiza aprobación de AdSense ni ingresos.
