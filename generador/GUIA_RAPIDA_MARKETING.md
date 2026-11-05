# Guía rápida de Marketing · v3.3

**¿Qué quieres hacer?**

| Caso | Paso 1 | Paso 2 | Paso 3 |
|---|---|---|---|
| Anuncio de Meta a una landing | Meta Ads + **Solo Web** | Pega la URL HTTPS | Fuente/medio sugeridos, campaña manual o 4 campos |
| Email con login Web + App | Email/CRM + **Web + App** | Web login y deeplink App, desde catálogo o constructor | Añade UTM; extras opcionales |
| Botón dentro de landing propia | **Dentro del banco + Solo Web** | URL Web del destino | **Sin UTM**; `source`/`detail` solo si hace falta |
| Pantalla nativa de la App | **Solo App** | Elige Nativo y escribe, por ejemplo, `exchange` | UTM o extras según canal y soporte App |
| Ruta interna `/u/...` | Web + App o Solo App | Elige **WebView** y pega `/u/...` | El generador arma el prefijo, conserva la ruta |
| Página pública abierta por la App | Solo App o Web + App | Elige **Browser** y pega HTTPS | Se parametriza la URL web interna |
| Clientes a flujo y no clientes a landing | **Clientes / No clientes** | Completa tres destinos | **Solo solicitud técnica, no publicable** |

## Lo que debes recordar

1. No pegues UTM nuevas en un botón **dentro** del propio sitio del banco sin aprobación de Analytics: podrían interferir con atribución.
2. `source` y `utm_source` son parámetros distintos. `utm_canal` y `cliente` tampoco se convierten automáticamente en dimensiones GA4.
3. `utm_campaign` se puede construir como `producto_campaña_tipo_objetivo` o escribir manualmente.
4. Si no se abre la App, **no está garantizado** que el enlace combinado lleve a una landing alternativa: depende de Tecnología.
5. Los parámetros pueden existir en la URL y **no aparecer en GA4** si GTM/Firebase no los recoge.
6. Antes de publicar prueba en Android/iOS, con y sin App, y comprueba las dimensiones en Analytics.

**Para abrirlo:** ejecuta un servidor HTTP local y entra a su `index.html`. La herramienta usa archivos JSON que deben cargarse desde el servidor.
