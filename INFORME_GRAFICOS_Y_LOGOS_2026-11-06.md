# PrecioDolarHoy.pe — versión 6 de noviembre de 2026

## Cambios del código

1. **Mejor compra / Mejor venta:** cada tarjeta muestra el logo local de la casa ganadora, sin ampliar el archivo 88×34 px; la marca es clicable si se dispone de una URL HTTP(S) válida. Si falta el logo, se ve el nombre; si faltan cotizaciones, se muestra un estado no disponible sin enlaces falsos. Ambas tasas salen del mismo conjunto de casas válido para la tabla.
2. **Recomendación redundante:** se retiró la tarjeta «Mejor opción para ti», que repetía a los ganadores.
3. **Gráfico SUNAT:** se muestra a todo el ancho del área central, **sin cambiar el ancho de la web**, y conserva las tasas SUNAT de compra y venta.
4. **Pestañas:** «30 días» utiliza hasta 30 registros diarios reales del endpoint existente `/sunat-mensual`. Según la cobertura real de la API pueden mostrarse menos días. «Hoy» **no inventa una evolución intradía**: indica que todavía no se dispone de un historial por horas. Para implementar ese gráfico en el futuro habrá que almacenar cotizaciones intradía en el backend o conectar una fuente autorizada de mercado.
5. **Datos históricos:** se mantienen los contratos `cargarSunatUltimos7Dias()` y `state.sunat7` para otros módulos, y se normalizan fechas ISO y día/mes/año, descartando fechas imposibles.
6. **Integración:** no se modificaron las fórmulas de calculadora, ranking, scrapers, Cloudflare Worker, página de guías ni las cinco reservas publicitarias.

## Resultados de comprobación

- Integridad: todos los archivos que existían en el ZIP anterior se conservan íntegros, salvo los cinco archivos de código modificados deliberadamente.
- Se ejecutó `node --check` en todos los JavaScript del proyecto.
- HTML: un H1, sin identificadores duplicados, enlaces internos de la portada resueltos, bloques JSON-LD válidos.
- Se ejecutaron pruebas aisladas en Chromium con CSS real y las funciones de portada para logos, enlaces y gráfico; se revisaron 12 anchos de pantalla (320–1920 px), sin desplazamiento horizontal.
- Se comprobó la pestaña «Hoy», el regreso al histórico y el caso en que no hay historial.
- Las tasas vistas en las capturas de prueba son **simuladas**, no datos del dominio real.

## Qué no se ha probado

El navegador de pruebas bloqueó la navegación a servidores locales y no tenemos acceso al Worker de producción. Por tanto, no hemos ejecutado una prueba de extremo a extremo con la API real ni verificado la página desplegada. Tras el despliegue, revisar la carga de las casas, logos, botones de salida, tasa SUNAT, gráfico, selector y calculadora en móvil y escritorio.

## Publicación segura en tu repositorio

Copia el contenido del ZIP pequeño dentro de tu carpeta Git conectada, sin borrar `.git` ni otras carpetas. Antes de agregar, confirma la rama con `git branch --show-current` y revisa `git status --short`. Trabaja en una rama nueva basada en `main` ya actualizado.

Para preparar **solo los archivos de esta entrega**, ejecuta desde la raíz del repositorio:

```powershell
git add -- index.html scripts/ui/bestHeader.js scripts/data.js scripts/home-redesign.js scripts/main.js css/home-market-refresh.css LEEME_GRAFICOS_Y_LOGOS_2026-11-06.md INFORME_GRAFICOS_Y_LOGOS_2026-11-06.md
git diff --cached --name-only
git -c core.safecrlf=false diff --cached --check
```

Si aparecen eliminaciones locales en `generador/`, no uses `git add .` ni `git add -A`: no son parte de esta actualización. No hagas `git push --force`.

## Sobre publicidad

Los cinco espacios siguen preparados y ocultos cuando no hay anuncios reales. Este ajuste no garantiza la aprobación de AdSense ni de otras redes.
