# PrecioDolarHoy.pe — corrección de gráfico y ajuste visual

## Resumen

Esta entrega parte del último ZIP «UNIFICACION_FINAL_COMPLETO», no del proyecto original. Conserva todas las páginas, imágenes, estilos y scripts existentes.

### Cambios de código (solo 3 archivos)

1. `index.html` — reorganiza la cabecera de SUNAT para mostrar compra y venta al lado del título, deja el gráfico debajo a todo el ancho y retira el botón visible «Ver gráfico detallado». Incluye la nueva hoja CSS.
2. `scripts/home-redesign.js` — **corrige la causa del gráfico vacío**: el atributo `hidden` permanecía en el SVG a pesar de haber dibujado los datos. Ahora se retira explícitamente al mostrar el gráfico; si no hay historial, vuelve a mostrarse el mensaje de ausencia de datos.
3. `css/home-final-polish.css` — reduce las tarjetas superiores, centra el logo de la recomendación y adapta el nuevo módulo SUNAT a escritorio, tablet y móvil.

No se modificaron la API Cloudflare, los scrapers, los cálculos del conversor, la selección de casas, el ranking, las guías ni los documentos legales. Las cinco reservas publicitarias siguen presentes, ocultas cuando no hay anuncios activos.

## Publicación recomendada en GitHub

**No borres la carpeta local, no borres `.git` y no elimines archivos que tu repositorio tenga de más.** Puedes extraer el ZIP completo como respaldo, pero para actualizar la web usa el ZIP pequeño «SOLO_CAMBIOS».

1. Abre tu repositorio de trabajo en VS Code y comprueba `git status` y `git branch --show-current`.
2. Asegúrate de partir de una rama cuyo commit ya esté en `main`. Si tienes cambios locales, revísalos antes de hacer `pull` o cambiar de rama.
3. Crea una rama para la corrección y copia solo `index.html`, `scripts/home-redesign.js` y `css/home-final-polish.css` conservando las rutas; añade este README y el informe si quieres.
4. Prepara los archivos explícitos con `git add -- index.html scripts/home-redesign.js css/home-final-polish.css LEEME_CORRECCION_GRAFICO_2026-11-05.md INFORME_PRUEBAS_GRAFICO_2026-11-05.md`.
5. Comprueba `git diff --cached --name-only` y `git diff --cached --check`. NO uses `git add .`, porque en tu copia local aparecían eliminaciones de `generador/`.
6. Realiza commit, push y Pull Request; revisa las verificaciones de GitHub antes de fusionar.

## Comprobaciones necesarias después de publicar

- Actualiza con Ctrl+F5 y comprueba que el gráfico muestre la línea de venta SUNAT, sin un rectángulo vacío.
- Verifica ambos modos del conversor: tengo soles y tengo dólares, con «cuánto recibo» y «cuánto necesito».
- Verifica que la mejor casa cambia al seleccionar otra operación, sin perder logos o enlaces.
- Comprueba el módulo SUNAT y el ranking en móvil.
- Si el gráfico muestra «Aún no hay suficientes datos históricos», comprueba la respuesta real de `/sunat-mensual`: la interfaz no inventa valores cuando faltan.

## Limitación

Las pruebas del entregable se hicieron con HTML/CSS reales y **cotizaciones de muestra** en un navegador aislado. El entorno no permitió consultar ni probar en vivo el Worker de Cloudflare. La aprobación de AdSense no depende únicamente del diseño.
