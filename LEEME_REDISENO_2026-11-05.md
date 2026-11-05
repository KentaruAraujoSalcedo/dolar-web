# PrecioDolarHoy.pe — Rediseño de portada (05/11/2026)

## Qué contiene esta entrega

Proyecto web **completo**, con sus páginas, scripts, imágenes y configuración existentes. La nueva portada reemplaza las secciones largas por una herramienta central de consulta de tipos de cambio. **No incluye el backend de Cloudflare ni los scrapers**, que siguen funcionando desde sus ubicaciones existentes.

**Nota de versiones:** el ZIP recibido para este encargo correspondía a una versión anterior a las correcciones que ya habíamos publicado. Para conservar esas correcciones, el proyecto final se ha construido sobre `PrecioDolarHoy_frontend_mejorado_2026-11-05.zip`, que ya contenía los arreglos previos. El resto de la web se ha preservado.

## Cómo queda la portada

1. Cabecera y navegación clara.
2. Mejor compra y mejor venta, procedentes de la API cuando están disponibles.
3. Calculadora prominente con ambas monedas y modos «¿Cuánto recibo?» / «¿Cuánto necesito?».
4. Referencia SUNAT separada, para no confundirla con una cotización de casa de cambio.
5. Comparador de tres tasas y botón para abrir el ranking completo de casas.
6. Gráfico de 7 registros de histórico SUNAT obtenidos de la API real, sin valores inventados. El modal histórico original sigue disponible.
7. Un único grupo de tres enlaces útiles, breve explicación del comparador y tres FAQ.
8. Footer con las páginas legales y de confianza.

Las demás páginas HTML (guías, landings, contacto, política de privacidad, etc.) **se conservan**. No se eliminaron URLs ni modificó el sitemap por el rediseño.

## Espacios publicitarios

Se reservaron **cinco posiciones**:

- `left-top`, `left-bottom`: dos a la izquierda.
- `right-top`, `right-bottom`: dos a la derecha.
- `content-horizontal`: una bajo el comparador y el gráfico.

Estas posiciones son **marcadores visuales**; NO contienen unidades monetizables ni hacen que AdSense funcione automáticamente. El código preexistente de verificación de AdSense sigue en el HTML. Por decisión de UX, los cuatro paneles laterales se ocultan bajo los **1170px** y el horizontal se adapta al móvil.

En `<body class="pdh-home ads-preview">`, la clase `ads-preview` permite ver los lugares reservados. Si no deseas mostrar espacios vacíos a visitantes, elimina `ads-preview` del `<body>`; así se ocultan los marcadores no rellenados. Cuando una red apruebe el sitio, se debe integrar su código real **siguiendo su política y con consentimiento válido**, sin suplantar logos ni colocar anuncios invasivos. No es recomendable activar automáticamente las cinco posiciones sin medir su efecto en la experiencia de usuario.

## Archivos nuevos / principales editados

- `index.html`: contenido y organización completa de la portada.
- `css/home-redesign.css`: estilos **limitados a `body.pdh-home`** y responsive para la portada.
- `scripts/home-redesign.js`: mini gráfico SVG de histórico SUNAT y conteo de cotizaciones reales.
- `scripts/ui/conversor.js`: cálculos con tasas disponibles, con SUNAT solo como fallback informativo.
- `scripts/ui/haveWant.js`: dirección coherente para el modo «necesito».
- `scripts/ui/events.js`: selección de monedas, modo, montos y botones.
- `scripts/ui/table.js`: estado vacío y resultados.
- `scripts/ui/bestDeal.js`: enlaces y presentación de casa destacada.
- `scripts/ui/sunat.js`, `scripts/ui/bestHeader.js`: estado sin cotización claramente identificado.
- `scripts/main.js`: coordinación con datos reales y gráfico de siete días.

Ver el manifiesto externo CSV para el inventario preciso de archivos modificados/nuevos.

## Publicación segura en GitHub

No subas el ZIP comprimido dentro del repositorio. **Descomprímelo** primero. Usa el repositorio clonado en tu equipo, en una **rama nueva**, y copia allí los archivos descomprimidos **sin borrar `.git` ni usar `git push --force`**. Revisa `git status` y `git diff` antes de crear commit y Pull Request. El nombre `dolar-web-main/` es la carpeta raíz del proyecto, NO una carpeta adicional que se deba anidar dentro del repositorio.

Se recomienda probar el ZIP mediante un servidor local que resuelva rutas absolutas como `/IMG/...` (por ejemplo una extensión Live Server en la raíz); abrir `index.html` directamente con `file://` puede romper imágenes y llamadas al Worker por las rutas y restricciones del navegador.

## Verificaciones después de desplegar

- Tasas reales de compra/venta y fecha de última actualización.
- Cambio USD→PEN y PEN→USD, con «recibo» y «necesito» y montos distintos.
- Tabla, enlace a la casa de cambio y ranking completo.
- SUNAT y gráfico; comportamiento cuando una fuente no responde.
- Diseño en 320/375/390px, tablet y escritorio de 1366px o más.
- Menú de guías, páginas legales, cookies y consentimiento.
- Search Console: indexación, rendimiento y métricas reales; ninguna modificación asegura aprobación de AdSense.

## Limitaciones de las pruebas realizadas

El código se comprobó con validaciones estáticas, Playwright/Chromium y **datos simulados** en un banco de pruebas. No se ejecutó una integración real en producción contra la API Cloudflare, ni una auditoría Lighthouse/Adsense en el dominio activo. Tampoco se cambiaron el Worker, scrapers ni GitHub Actions. Debes probar la versión publicada antes de dar por finalizada la actualización.
