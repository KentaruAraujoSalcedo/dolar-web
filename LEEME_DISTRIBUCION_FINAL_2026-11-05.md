# PrecioDolarHoy.pe — Nueva distribución de la portada

**Fecha:** 5 de noviembre de 2026
**Alcance:** frontend de la portada. No se modifican Cloudflare Workers, GitHub Actions ni scrapers.

## Qué cambió

- Cabecera: **«Dólar hoy en Perú»**, mejor compra y mejor venta comparten la primera fila de escritorio.
- Herramientas: calculadora y comparador siguen una al lado de la otra en pantallas grandes; el ranking muestra las mismas casas y operaciones.
- Referencias: **mejor casa para ti + SUNAT + evolución SUNAT** en una sola fila de escritorio. En tablet el gráfico pasa debajo y en móvil las tres tarjetas se apilan.
- Recomendación: destaca **solo la tasa aplicable a la operación**; se mantienen los identificadores `best-buy` y `best-sell` usados por los scripts, pero sus valores duplicados ya no se muestran visualmente.
- Fondo: se eliminó el comportamiento de fondo fijo que podía crear franjas en algunas capturas largas.
- Publicidad: permanecen las 4 reservas laterales y 1 horizontal. Los contenedores vacíos no se muestran a los visitantes. La clase temporal `ads-preview` en `<body>` permite **previsualizar** las reservas, pero no constituye integración con una red publicitaria.

## Archivos de código modificados

1. `index.html` — orden de bloques, nuevo resumen de tasa y enlace al CSS final.
2. `scripts/ui/bestDeal.js` — actualiza la tasa seleccionada al cambiar de comprar a vender dólares.
3. `css/home-layout-optimized.css` — **archivo nuevo** con distribución responsive y fondo continuo.

El resto del proyecto original se conserva. También se añadieron este README y el informe de pruebas.

## Cómo instalar sin perder datos de tu repositorio

1. Conserva una copia o rama de respaldo de GitHub.
2. **No borres `dolar-web-publicacion`, ni su carpeta `.git`, ni otras carpetas como `generador/`.**
3. En el repositorio que ya tienes clonado, crea una rama nueva desde la versión publicada más reciente. Si tienes modificaciones locales pendientes, comprueba `git status` antes de cambiar de rama.
4. Copia o reemplaza **solo estos 3 archivos de código** respetando sus rutas; añade opcionalmente este README y el informe de pruebas.
5. Prepara únicamente los archivos que deseas subir. Ejemplo: `git add -- index.html scripts/ui/bestDeal.js css/home-layout-optimized.css`.
6. Revisa `git diff --cached --name-only` y `git diff --cached --check`, realiza el commit y sube la rama.
7. Crea un Pull Request a `main` y revisa las comprobaciones antes de fusionar.

**No uses `git add -A` ni `git add .` si siguen apareciendo eliminaciones locales que no deseas publicar**, especialmente en `generador/`.

## Verificaciones imprescindibles en la web publicada

- Abrir la portada con recarga completa (`Ctrl + F5`) y comprobar la carga de casas desde Cloudflare.
- Probar «Tengo dólares / Tengo soles» y «¿Cuánto recibo? / ¿Cuánto necesito?». La mejor casa, la tasa seleccionada y la tabla deben cambiar de manera coherente.
- Comprobar el botón «Visitar casa de cambio», las casas del ranking, el modal de ranking y el gráfico detallado.
- Revisar la portada en móvil y escritorio y confirmar que SUNAT muestre su fecha/tasa real.
- Revisar que ninguna carpeta o función adicional del repositorio haya sido eliminada.

## AdSense y otras redes

Esta versión mejora la presentación y utilidad de la portada, pero **no garantiza la aprobación de Google AdSense** ni la de otra red. AdSense evalúa también calidad, originalidad, cumplimiento de políticas, experiencia de usuario y otros factores. No se ha habilitado ninguna unidad publicitaria real.

Para recibir publicidad, necesitarás la aprobación del proveedor, la integración y revisión de sus unidades, y el cumplimiento aplicable sobre privacidad, consentimiento y políticas de anuncios. No coloques falsos anuncios para simular aprobación.
