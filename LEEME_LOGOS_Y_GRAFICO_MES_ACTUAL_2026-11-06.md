# PrecioDolarHoy.pe · Ajuste de logos y gráfico SUNAT

Entrega: 6 de noviembre de 2026. Basada en el ZIP completo «PrecioDolarHoy_LOGOS_GRAFICO_COMPLETO_2026-11-06.zip».

## Cambios

- **Mejor compra y mejor venta:** los logos enlazados se sitúan a la derecha de la tasa y su texto. La marca conserva el enlace original y el nombre alternativo si falta la imagen. En pantallas pequeñas se utiliza un tamaño reducido para no provocar desplazamiento horizontal.
- **Evolución SUNAT:** el gráfico se ajusta al ancho interno de la tarjeta y distribuye los puntos reales disponibles entre el inicio y el final del período; deja de quedarse estrecho y centrado por la proporción rígida del SVG.
- **«Mes actual»:** reemplaza «30 días». Se informa del mes al que corresponden realmente los registros y del número de registros disponibles. El histórico continúa viniendo exclusivamente de `/sunat-mensual` y **no** se modifica el scraper.
- **«Hoy»:** conserva su mensaje informativo porque actualmente no hay una serie intradía por horas en la API. No se inventan datos.
- Se conserva **el ancho general**, así como los espacios publicitarios preparados, la calculadora, el ranking y las demás páginas.

## Subir solamente los cambios en Visual Studio Code

1. Descomprime el ZIP pequeño en una carpeta **separada**.
2. Abre la carpeta interior `dolar-web-main` y copia su contenido a `D:\preciodolarhoy\dolar-web-publicacion`, respetando subcarpetas. **No borres ni sustituyas la carpeta `.git`**. No borres `generador/`.
3. En la terminal, ejecuta `git branch --show-current`, `git status --short`, `git fetch origin` y `git log --oneline origin/main..HEAD` antes de crear la nueva rama. Si aparecen commits pendientes, revísalos antes de continuar.
4. Cuando estés en una rama actualizada basada en `main`, crea una rama nueva, por ejemplo: `git switch -c logos-grafico-mes-2026-11-06`.
5. Agrega **solamente** los archivos siguientes (o incluye los dos documentos si deseas conservarlos):

```powershell
git add -- index.html css/home-market-refresh.css scripts/home-redesign.js
# Opcional: git add -- LEEME_LOGOS_Y_GRAFICO_MES_ACTUAL_2026-11-06.md INFORME_PRUEBAS_LOGOS_Y_GRAFICO_2026-11-06.md
git diff --cached --name-only
git -c core.safecrlf=false diff --cached --check
```

No uses `git add .`, `git add -A` ni `git push --force` en este proyecto si `generador/` aparece eliminado localmente. Si el último comando detecta espacios sobrantes, corrígelos antes del commit.

## Verificación después de publicar

- El logo de la mejor compra debe quedar a la **derecha** de la tasa y ser clicable.
- El logo de la mejor venta debe quedar a la **derecha** de la tasa y ser clicable.
- El gráfico SUNAT debe utilizar el ancho interior de su tarjeta aun con 6 registros y mostrar la etiqueta «Mes actual» y el recuento real.
- Al seleccionar «Hoy», debe aparecer una explicación de que aún no hay datos por hora; al volver a «Mes actual», debe reaparecer la curva.
- Comprobar calculadora, tabla, cambios USD/PEN, modales y navegación en móvil.

La prueba integrada con la API real y la publicación en el dominio no pudo realizarse desde este entorno. La aprobación de AdSense depende de la evaluación de Google y no está garantizada por un ajuste visual.
