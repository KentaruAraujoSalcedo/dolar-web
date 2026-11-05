# Informe de comprobaciones — ajuste de portada

Fecha: 5 de noviembre de 2026.

## Integridad y revisión estática

- ZIP de referencia: `PrecioDolarHoy_redisenado_completo_2026-11-05.zip`.
- **Archivos originales perdidos:** 0.
- **Páginas HTML preservadas:** 23.
- **Rutas internas locales rotas detectadas:** 0, según análisis del HTML del proyecto.
- **Referencias de recursos locales faltantes en la portada:** 0.
- **JSON-LD de portada:** 6 bloques parseables.
- **JavaScript:** 26 archivos con comprobación de sintaxis `node --check` satisfactoria.
- **CSS nuevos:** parseo de la hoja de estilos sin errores de nivel superior.
- **IDs que requieren los módulos JS:** sin duplicaciones y presentes después del movimiento de secciones.

## Comprobaciones de lógica

Se usaron casos numéricos de ejemplo (compra 3.445 y venta 3.448) para evaluar `calcularCambio`:

- USD a PEN, «¿Cuánto recibo?» → 1000 × 3.445.
- USD a PEN, «¿Cuánto necesito?» → 1000 ÷ 3.445.
- PEN a USD, «¿Cuánto recibo?» → 1000 ÷ 3.448.
- PEN a USD, «¿Cuánto necesito?» → 1000 × 3.448.
- Entradas negativas y orden del ranking según la operación.
- Datos SUNAT separados de las casas, limpieza del ranking y escapado de HTML.

Todos los casos automatizados definidos para esta revisión pasaron.

## Vista previa de maquetación

Se renderizó el HTML/CSS en Chromium mediante una vista aislada, con datos **simulados** colocados para inspección visual. Se probaron los anchos **320, 390, 660, 768, 820, 1000, 1280, 1366 y 1600 píxeles**.

- Sin desbordamiento horizontal del documento en esos anchos.
- Tasas y mejor casa en primera fila a partir de 820 px.
- Calculadora y comparador comienzan a la misma altura a partir de 820 px.
- SUNAT bajo la herramienta, junto al gráfico en escritorio; apilados en teléfono.
- Reservas de anuncios laterales ocultas en móviles y disponibles en vista previa de escritorio (`ads-preview`).

## Alcance y limitaciones

- **No hubo prueba integrada de navegación HTTP del sitio completo**: el entorno de pruebas bloqueó la navegación tanto a la URL local como a una URL ficticia.
- Las capturas se generaron con HTML/CSS estático, y no acreditan el ciclo de red de la API real, respuesta del hosting o interacción completa de todos los modales.
- **No hubo comprobación en vivo de Google Search Console ni de la evaluación AdSense.**
- No se modificaron Cloudflare, los scrapers ni sus credenciales; tampoco se hizo una auditoría en producción de cumplimiento de privacidad/publicidad.
- Antes de publicar, comprobar con los datos reales el conversor y las casas; después del despliegue, repetir las pruebas en teléfonos y ordenadores reales.

## Recomendación de publicación

Subir el proyecto en una **rama independiente**, revisar las diferencias, crear Pull Request y fusionar a `main` únicamente después de probar las funciones centrales. Conservar una copia del estado publicado anterior para facilitar la reversión.
