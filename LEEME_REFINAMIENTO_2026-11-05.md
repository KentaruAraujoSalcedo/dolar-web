# PrecioDolarHoy.pe — Refinamiento visual (5 de noviembre de 2026)

Esta entrega está construida sobre **PrecioDolarHoy_FINAL_ajustes_2026-11-05.zip**, sin eliminar ni sustituir otras páginas, scrapers o API.

## Qué se cambió

- **Portada (`index.html`)**: título y actualización arriba; tres indicadores alineados debajo: mejor compra, mejor venta y mejor casa para la operación seleccionada.
- **Tarjeta de mejor casa**: eliminada la caja amarilla interna y la repetición visual de logo + nombre. Se muestra el **logo**, y el nombre solo si ese logo no puede cargarse.
- **Operación**: la tarjeta indica «Para vender dólares» o «Para comprar dólares» de acuerdo con la selección.
- **Botón**: acción clara «Visitar casa de cambio», con nombre específico en la etiqueta accesible y validación de URL ya existente.
- **Estilos (`css/home-polish.css`)**: proporciones, espaciado, tipografía, alineación y versión móvil, manteniendo colores ciruela/gris y compra verde/venta rojo moderados.
- **Lógica (`scripts/ui/bestDeal.js`)**: nueva gestión de logo y texto alternativo, actualizada según el estado; no se cambian endpoints ni fórmulas del comparador.
- **Publicidad**: preservadas las cuatro reservas laterales y la reserva horizontal. Siguen ocultas mientras no haya anuncios reales configurados; no se añadieron anuncios ni se garantiza AdSense.

## Pruebas ejecutadas

- ZIP anterior íntegro y archivos preservados (ver informe de verificación de esta entrega).
- Sintaxis JavaScript de los 26 archivos; parseo CSS de la hoja modificada.
- Conservación de los IDs del DOM y de los cinco data-ad-slot.
- Comprobación de las 23 páginas HTML existentes.
- Vista previa con los estilos reales y **datos de muestra** a 320, 360, 390, 768, 1024, 1366 y 1600 píxeles; sin desbordamiento horizontal.
- Prueba aislada de `renderBestDeal`: estados de compra/venta, logo disponible, nombre alternativo y ausencia de datos.

**Limitación**: el entorno no permite acceder al sitio local como una web servida ni a tu API de producción. Las vistas previas se generan con HTML/CSS reales y cotizaciones de prueba; es imprescindible revisar en el dominio la calculadora, el ranking, el botón externo y los datos reales antes de publicar como estable.

## Cómo subir a GitHub sin borrar otras carpetas

1. Conserva la copia de producción. Trabaja en una rama nueva desde `main` actualizado, idealmente en un clon limpio.
2. Descomprime el ZIP. Copia los archivos **contenidos dentro** de `dolar-web-main`, sin reemplazar la carpeta `.git` existente.
3. Haz `git status --short` para identificar modificaciones ajenas (por ejemplo, `generador/`). **No uses `git add -A`** si aparecen eliminaciones ajenas.
4. Si no has modificado manualmente otros archivos, los archivos de código que cambian respecto al ZIP anterior son exactamente:

```
index.html
css/home-polish.css
scripts/ui/bestDeal.js
```

5. Prepara solo esos archivos y este README:

```powershell
git add -- index.html css/home-polish.css scripts/ui/bestDeal.js LEEME_REFINAMIENTO_2026-11-05.md
git --no-pager diff --cached --stat
git -c core.safecrlf=false diff --cached --check
```

6. Confirma la rama correcta, crea el commit, sube esa rama y revisa un Pull Request antes de fusionar con `main`.

## Monetización

La actualización prioriza la utilidad del comparador y reduce decoración innecesaria. No garantiza la aprobación de AdSense: el motivo de rechazo también depende de contenido original, accesibilidad, confianza, políticas, funcionamiento real y evaluación del proveedor. No muestres anuncios falsos ni ocultes publicidad real: identifica las unidades cuando las actives.
