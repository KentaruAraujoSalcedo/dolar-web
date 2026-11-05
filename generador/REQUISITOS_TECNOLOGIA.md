# Requerimientos para Tecnología: enlace clientes / no clientes

**Estado:** preparado a nivel de datos e interfaz, **no implementado como redirección real**.

## Objetivo

Poder compartir **una sola URL HTTPS** en landings del banco, email, SMS, QR o campañas, cuya navegación respete:

1. Cliente con App compatible → abrir App en pantalla definida; solicitar autenticación solo si el flujo lo requiere.
2. Cliente sin App compatible → login Web y navegación al destino correspondiente.
3. No cliente → landing pública configurada (por ejemplo Open Market), **sin obligarlo a pasar por login de cliente**.

## Información que ya exporta el generador

La opción «Clientes / No clientes» solicita y exporta en JSON:

- `cliente_url_web`
- `cliente_deeplink_app`
- `cliente_url_combinada_para_pruebas` (prototipo usando `embeddedURL`)
- `no_cliente_landing`
- parámetros de campaña o navegación interna (`utm_*`, `detail`, `source=campaign` según modo)
- `criterios_aceptacion`

El generador no inventa endpoints ni parámetros funcionales del banco para activar el fallback: no crea `fallbackURL` o `redirectNoCliente` como si fueran soportados.

## Definiciones por acordar con el equipo App/Web/Login

- ¿Cuál será el **dominio y ruta HTTPS de entrada** y quién lo hospedará?
- ¿Qué Android App Links / iOS Universal Links están asociados y verificables, qué navegadores/canales se soportan?
- ¿En qué punto y con qué autorización se determina **cliente vs. no cliente**? La presencia de la App **no lo determina**.
- ¿Qué ocurre cuando el usuario está deslogueado, la sesión expiró o canceló el login?
- ¿Cómo se controlan redirecciones para prevenir *open redirects*? Usar destinos autorizados; no aceptar URLs externas arbitrarias.
- ¿Qué parámetros se permiten y se preservan en ambos destinos? Cómo se registrarán los eventos GA4/Firebase/BigQuery.
- ¿Cómo se comportará escritorio, navegador in-app, Gmail/Outlook, QR y WhatsApp?

## Criterios mínimos de aceptación

- [ ] App con cliente autenticado → sección App indicada.
- [ ] App con cliente no autenticado → login App si corresponde → sección.
- [ ] Cliente sin App → login Web → sección Web.
- [ ] Usuario no cliente → landing pública sin login de cliente.
- [ ] Usuario sin App que sí es cliente no es clasificado como no cliente por ese solo motivo.
- [ ] Navegación segura, sin exponer información personal ni tokens en el link.
- [ ] Los parámetros aprobados de campaña se preservan y miden según especificación.
- [ ] Pruebas Android/iOS, con/sin App, clientes/no clientes, con/sin sesión, emails y navegadores in-app.

**Aviso de producto:** hasta que se complete esta integración, la interfaz señala «NO PUBLICAR» para esta modalidad.
