# QA local · Generador Marketing v3.3

Fecha de ejecución: 4 de noviembre de 2026, hora de Perú (5 de noviembre UTC).

Se ejecutaron las **22 pruebas de regresión Node de la v3.2** y las **12 comprobaciones de flujo automatizadas en Chromium** del archivo `QA_NAVEGADOR_V3_3.py`. Incluyen: carga del `index.html` único, carga de los catálogos, Solo Web/App, extras con/sin UTM, Web + App, `utm_campaign` construido y manual, Nativo, WebView, Browser y sus parámetros anidados, modalidad no publicable de clientes/no clientes, navegación al Catálogo, y ausencia de errores JS durante el flujo.

Responsive: revisadas las pestañas Generador, Catálogo y Configurar destino en anchos de **320, 390, 768, 1024 y 1440 px**, sin desbordamiento horizontal en los escenarios probados.

Comandos reproducibles (desde la carpeta del proyecto):

```
node qa/REGRESION_V3_2.js
python qa/QA_NAVEGADOR_V3_3.py
```

Los tests en navegador requieren Python, `playwright`, `bs4` y Chromium local. El script de pruebas carga datos JSON locales en memoria: **no necesita conexión a dominios del banco**.

Las comprobaciones **no prueban** que rutas nativas existan, que los servidores admitan `embeddedURL`, que un enlace de correo abra la App, que los fallbacks o la autenticación funcionen, ni que GA4 capture parámetros personalizados. Esas verificaciones deben realizarse con Tecnología/Analytics en entornos del banco.
