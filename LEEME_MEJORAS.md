# Precio Dólar Hoy — versión revisada (5 de noviembre de 2026)

Este ZIP contiene el proyecto **completo** recibido y una primera ronda de correcciones verificables. Se mantuvieron los HTML, CSS, JavaScript, imágenes, archivos de configuración, `robots.txt`, `sitemap.xml` y `.well-known/security.txt`. El proyecto sigue siendo un sitio estático con llamadas a la API externa existente.

## Qué se corrigió

1. **Enlaces del pie de página**: se quitaron enlaces simulados (`#`), el enlace de YouTube que apuntaba a `/generador/index.html` y el botón de Google Play sin URL real. Se sustituyeron por enlaces de transparencia y contacto que sí existen.
2. **Publicidad sin activar**: se conservó el script existente de AdSense en la cabecera para no interferir con una posible verificación de propiedad del sitio. Los seis contenedores publicitarios permanecen en HTML, pero la clase `ads-paused` del `<body>` impide reservar grandes espacios vacíos y adapta el grid a un formato centrado sin anuncios. El contenedor final ahora tiene `data-ad-slot="final-responsive"` para evitar un identificador de slot repetido.
3. **Consentimiento**: las siete páginas que carecían de interfaz de elección ahora utilizan el mismo banner y el script común de cookies. Se añadieron etiquetas de región accesibles a los banners y se eliminó una segunda definición redundante de `resetCookieConsent()` en `cookies.html`.
4. **Seguridad en HTML dinámico**: se escaparon textos y atributos variables al dibujar las filas del comparador; los destinos de enlaces se validan en `withUTM`. Los logos del modal se construyen como nodos DOM en vez de concatenar HTML. El botón de la casa destacada no abre una URL inválida.
5. **Estados de error**: el nombre y botón de la casa destacada ya no aparecen prellenados con una empresa específica mientras faltan datos. Si falla la API, se muestra un mensaje de error y se sigue inicializando la interfaz en lugar de dejarla parcialmente bloqueada.
6. **Información editorial útil**: la portada incluye la metodología de ordenación, el alcance de los resultados disponibles y sus límites. La página `about.html` explica fuentes, criterios de orden, limitaciones y política de independencia. Se amplió `guias/donde-cambiar-dolares-peru/` con una comparación práctica y un ejemplo numérico expresamente hipotético; se corrigió el texto `онлайн` por español. Se eliminó un párrafo idéntico repetido en la landing de Lima.
7. **Privacidad**: se sustituyeron afirmaciones absolutas potencialmente imprecisas sobre el tratamiento de datos por una descripción más prudente de los servicios configurados. Estas páginas deben revisarse de nuevo conforme a las herramientas efectivamente activadas y la normativa aplicable.
8. **Sitemap**: solo se actualizó `lastmod` de las cinco páginas que recibieron cambios editoriales significativos (`/`, `/about.html`, `/privacy.html`, `/dolar-hoy-lima/` y la guía reescrita).
9. **Textos de interfaz**: el botón de ranking ahora dice «Ver tasas disponibles», evitando prometer la cobertura total del mercado.

## Qué deliberadamente NO se cambió

- **API Cloudflare**: la URL y el contrato actual en `scripts/config.js` se mantienen exactamente. La API externa y los scrapers no están dentro de este ZIP.
- **Fórmulas y selección de las tasas**: se conservan los modos del conversor y la construcción de la lista desde `payload.resumen`, porque el usuario confirmó su operación. Sin el contrato real de `/api/data` no es seguro asumir que existen más resultados para mostrar. El «ranking» del sitio representa los registros recibidos, no necesariamente todas las casas monitoreadas.
- **Diseño base y animaciones**: se conservaron los temas principales y las funciones existentes. La maquetación de publicidad en pausa es reversible.
- **Google Fonts**: el uso conjunto de `preload`, stylesheet y fallback `noscript` es intencional; no se eliminó automáticamente como «duplicación» porque puede ser un patrón legítimo de carga.

## Para publicar con cuidado

1. Guarda una copia del ZIP original o crea una rama antes de reemplazar archivos.
2. Descomprime este ZIP y despliega la **carpeta `dolar-web-main/` completa**, siguiendo el mismo procedimiento que usabas. No publiques únicamente los archivos de esta lista.
3. Prueba en el dominio real la carga de cotizaciones, el conversor en ambos modos, el modal de ranking, el gráfico SUNAT, el aviso de cookies, las páginas legales y la interfaz móvil.
4. Comprueba en DevTools si hay errores de red y en Google Search Console si el sitemap e indexación siguen correctos.
5. Si se habilita una red de anuncios, **no basta** con quitar `ads-paused`: configura las unidades reales de la red (el script de AdSense actual ya está incluido), activa los contenedores correspondientes, prueba consentimiento y actualiza cookies/privacidad y `ads.txt` si el proveedor lo exige. Revisa también su política de formatos y la normativa aplicable.

## Alcance y limitaciones

- Se validaron los 23 HTML con revisiones estructurales, las rutas a recursos estáticos, los 25 JS con `node --check`, y los cálculos y escape de HTML con tests de Node.
- Se realizaron comprobaciones visuales estáticas (CSS y HTML, sin servicios externos) en Chromium a 375, 768 y 1366 píxeles: no apareció desbordamiento horizontal en esas medidas.
- **No se pudo ejecutar una prueba integrada real de navegación**, porque el navegador de este entorno bloquea el acceso a archivos/servidor local por políticas de administrador. Tampoco se pudo verificar la API de producción, el despliegue o la aprobación de AdSense.
- La seguridad de los datos dinámicos se reforzó en los lugares identificados; esto no es una auditoría de pentesting o una certificación de cumplimiento legal.
- Las mejoras de SEO y contenido no garantizan aprobación de AdSense, tráfico ni ingresos. Para priorizar la siguiente etapa hacen falta datos de Search Console y, si es posible, una captura de la evaluación de AdSense.

Si modificas CSS fuente modular en el futuro, recuerda sincronizar también los archivos de tema unificados utilizados por las páginas. En esta revisión, el ajuste estructural se aplicó tanto a `css/estructura/layout-estructura.css` como al tema `css/themes-estructura/theme-estructura-base.css`.
