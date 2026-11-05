# PrecioDolarHoy.pe — Ajustes finales de portada y monetización

**Entrega:** 5 de noviembre de 2026. **Base:** `PrecioDolarHoy_redisenado_completo_2026-11-05.zip` (se conserva todo el proyecto anterior).

## Cambios implementados

- **Primera fila:** tasas de compra y venta a la izquierda y una tarjeta independiente para la mejor casa de cambio según moneda/modo a la derecha.
- **Segunda fila:** calculadora y comparador colocados a la misma altura inicial. No se fuerzan alturas artificiales; cada tarjeta crece según sus resultados.
- **Tercera fila:** gráfico de los últimos siete datos históricos SUNAT y cotizaciones SUNAT de referencia, debajo de las herramientas principales.
- **Ranking de portada:** ahora se muestran **hasta cinco** casas de cambio; sigue accesible el ranking completo en el modal y la selección de compra/venta. Las tasas siguen procediendo de la API existente.
- **Identidad visual:** fondo oscuro original (`IMG/wallpapers/base.webp`), paneles gris translúcido, botones ciruela y toques lima suaves. Menos morado saturado y blancos intensos.
- **Portada:** textos secundarios breves y enlaces a guías que conservan sus URLs y contenido.
- **Publicidad:** se conservan las cinco posiciones (dos laterales izquierdas, dos laterales derechas y una horizontal), pero los **espacios vacíos están ocultos de forma predeterminada en producción**. Para comprobarlos visualmente durante el diseño, añade temporalmente `ads-preview` a `<body class="pdh-home">` y vuelve a retirarla antes de publicar. El código anterior de AdSense permanece en la cabecera; esto NO significa que la cuenta esté aprobada ni que se estén mostrando anuncios de pago.

## Archivos de esta iteración

- `index.html`: estructura de las tres filas, nueva hoja de estilo y presentación del método.
- `css/home-polish.css`: nueva capa CSS **solo para la portada**; no modifica las otras 22 páginas.
- `scripts/ui/table.js`: aumenta el límite de 3 a 5 casas principales visibles; conserva lógica de cálculo y modal.
- `LEEME_AJUSTES_FINALES_2026-11-05.md`: estas instrucciones.
- `INFORME_PRUEBAS_2026-11-05.md`: resultados y limitaciones de la validación.

La API de Cloudflare, sus URLs, los scrapers, `scripts/data.js` y los demás componentes de la calculadora se conservan tal cual estaban en el ZIP base.

## Cómo publicar sin perder `.git`

No borres ni reemplaces la carpeta completa de tu repositorio. **Descomprime el ZIP** y copia únicamente su contenido a una rama nueva creada sobre el `main` actualizado de tu repositorio clonado.

Ejemplo desde PowerShell, en la raíz de tu repositorio clonado (`D:\preciodolarhoy\dolar-web-publicacion`):

```powershell
cd D:\preciodolarhoy\dolar-web-publicacion
git status
git switch main
git pull origin main
git switch -c ajustes-finales-2026-11-05
```

Si `git status` muestra cambios locales antes del cambio de rama, **detente** y respáldalos o revísalos primero. Copia el contenido descomprimido (las carpetas `css`, `scripts`, `guias`, `IMG`, `index.html`, etc.) **dentro de la raíz del repositorio**, sin copiar la carpeta contenedora `dolar-web-main` encima de él. No toques `.git`. Puedes hacerlo desde el Explorador de Windows o mediante `robocopy` excluyendo `.git`.

Después:

```powershell
git status --short
git diff --check
git add index.html css/home-polish.css scripts/ui/table.js LEEME_AJUSTES_FINALES_2026-11-05.md INFORME_PRUEBAS_2026-11-05.md
git diff --cached --stat
git commit -m "Ajusta portada y recupera colores originales"
git push -u origin ajustes-finales-2026-11-05
```

Crea un Pull Request hacia `main`. Revisa los archivos y cualquier comprobación disponible antes de fusionar. No uses `git push --force` ni borres todo tu repositorio.

## Antes de volver a solicitar AdSense (o usar otra red)

1. Confirma que tu dominio sirve correctamente la nueva versión y que recibe tasas reales, con fecha y hora actualizadas.
2. Comprueba manualmente la calculadora en cuatro escenarios y verifica el ranking, el modal y el enlace de al menos dos casas.
3. Verifica páginas de privacidad, cookies, contacto, sobre nosotros y metodología; que las afirmaciones y la información de contacto sean correctas.
4. Revisa Google Search Console: páginas indexadas, problemas de rastreo, consultas, rendimiento y contenido duplicado.
5. Mantén anuncios reales identificados y utiliza el control de consentimiento aplicable. Evita pop-ups y colocaciones que tapen la herramienta.
6. Activa espacios publicitarios **solo después** de cumplir las condiciones y la aprobación del proveedor, y mide su efecto sobre velocidad, accesibilidad y experiencia.

**No se puede prometer una aprobación de AdSense ni ingresos publicitarios.** El motivo «contenido de poco valor» depende de la evaluación del sitio público por parte de Google, no únicamente de la apariencia de la portada.

## Validación del rediseño

Se comprobó la presentación estática en 9 anchos (320, 390, 660, 768, 820, 1000, 1280, 1366, 1600 px). En las capturas se insertaron valores **ilustrativos** directamente en el HTML para comprobar los espacios; **no son cotizaciones en vivo**. Los cálculos de las funciones JS se probaron aparte. La ejecución integrada del frontend contra la API real y el comportamiento del hosting deben validarse tras desplegar.
