# QA · Generador de Links Marketing v3.4

## Alcance y resultados de las pruebas locales

- **22 pruebas** de regresión de construcción de URLs (`node qa/REGRESION_V3_2.js`).
- **12 comprobaciones** del recorrido existente en Chromium (`python qa/QA_NAVEGADOR_V3_3.py`).
- **19 pruebas** nuevas de asistente en Chromium (`python qa/QA_ASISTENTE_V3_4.py`).
- **Cinco resoluciones** sin desplazamiento horizontal de la pestaña Asistente y Generador: 320, 390, 768, 1024 y 1440 píxeles.
- Se revisaron las sugerencias de canales, destinos App/Web, `source`, `detail`, campaña manual, enlaces internos sin UTM, importación al generador, comportamiento no publicable de Clientes / No clientes, campos desconocidos, entrada HTML inyectada como texto, y salida de JavaScript sin errores.

Los tests del navegador se ejecutaron con catálogos JSON locales servidos desde memoria (sin navegar a dominios externos), usando Chromium headless. Los archivos de capturas están en `qa/`.

## Limitaciones del QA

Estos tests no confirman que `scotiabankpe:///` abra una pantalla concreta, que el login del banco conserve una sesión, que la App esté instalada, que exista un fallback público, ni que se registren parámetros en GA4/BigQuery. Esas validaciones requieren pruebas en los sistemas y dispositivos reales del banco.

La interpretación de lenguaje natural se basa en reglas, no en inferencia generativa. Los mensajes ambiguos **deben** revisarse por una persona antes de copiar la URL final.
