# Guía rápida para Marketing · Generador de Links v3.1

## Antes de crear el enlace

**Pregúntate:** ¿dónde voy a ponerlo, qué quiero que haga el usuario y cómo sabré de qué campaña llegó?

En el generador sigue el orden: **1. Canal y objetivo → 2. Destino → 3. Medición → 4. Generar y probar**.

### ¿Qué objetivo debo seleccionar?

| Quiero que ocurra esto | Elijo |
|---|---|
| Que el botón abra una landing o Open Market | **Abrir una página web** |
| Que el botón intente abrir directamente la App | **Abrir solo la App** |
| Que se intente abrir la App y, si no, el login web | **App instalada / Login Web** (necesita pruebas) |
| Que los clientes vayan al login/servicio y los no clientes a una landing | **Clientes / No clientes** (solo preparación para Tecnología; NO publicar aún) |

### ¿Cuándo debo poner UTM?

**Sí:** enlace de una campaña **externa** de Meta, Google, Email, etc. Las UTM identifican cómo entró el visitante.

**No:** un botón dentro de otra página del banco. Para identificar ese botón puedes usar `detail` (si el destino lo admite) sin atribuir una campaña externa nueva.

### Ejemplos guiados (válidos para cualquier producto)

**A. Botón de una landing del banco → otra página web**

1. En **Paso 1**, elige **Dentro de la web del banco** y **Abrir una página web**.
2. En **Paso 2**, selecciona el destino del catálogo o pega su URL HTTPS aprobada. No necesitas seleccionar una ruta App.
3. En **Paso 3**, confirma **sin UTM**. Opcionalmente escribe un identificador de botón en `detail`, por ejemplo `cta_banner_principal`, y habilita `source=campaign` **solo si el destino lo admite**.
4. Pulsa **Generar link**. Comprueba que no contiene `utm_source`, `utm_medium`, `utm_campaign` ni `embeddedURL`.

**B. Campaña de Meta Ads → landing Web**

1. En **Paso 1**, selecciona **Meta Ads** y **Abrir una página web**.
2. En **Paso 2**, elige o pega la landing HTTPS aprobada.
3. En **Paso 3**, revisa la sugerencia de `utm_source=meta` y `utm_medium=paid-social`, escribe `utm_campaign` según la nomenclatura del equipo y, si corresponde, `utm_content` para distinguir el anuncio.
4. Genera el enlace y verifica que conserve el destino y las UTM correctas.

**C. Google Ads → landing Web**

1. En **Paso 1**, selecciona **Google Ads** y **Abrir una página web**.
2. En **Paso 2**, coloca la URL de destino.
3. El asistente sugiere `google / paid-cpc` según el catálogo. **Antes de publicar**, confirma con Analytics cómo se combina con el autoetiquetado de Google Ads.
4. Completa `utm_campaign`, genera y valida.

**D. Email → enlace combinado App / Login Web**

1. Selecciona **Email / CRM** y **Abrir App o login Web**.
2. En **Paso 2**, ingresa la URL HTTPS de login con `redirectTo` y el deeplink App **ya aprobados** para el producto.
3. En **Paso 3**, revisa las UTM de tu envío y, si aplica, `detail` para distinguir el CTA.
4. Genera el enlace. El generador pondrá el deeplink dentro de `embeddedURL` sin que tengas que codificarlo manualmente.
5. Prueba **desde el correo real**, con y sin App y desde Android/iOS. No está garantizado el fallback en todos los canales y dispositivos.

**E. Cliente / No cliente → alternativa comercial (solo preparación)**

1. Selecciona **Clientes / No clientes**. Verás el aviso de **pendiente de Tecnología**.
2. Indica las rutas Web y App del cliente y la landing HTTPS pública del no cliente.
3. Genera la propuesta y descarga la **ficha JSON para Tecnología**.
4. **No publiques el enlace candidato** como si detectara al cliente; el enrutamiento todavía no está implementado.

### Errores que hay que evitar

- No usar `utm_source=web` en un botón interno solo para rastrearlo: cambia o fragmenta la atribución.
- No confundir `source=campaign` con `utm_source`: son parámetros distintos.
- No creer que `embeddedURL` significa que existe detección perfecta de App instalada.
- No creer que tener App instalada equivale a ser cliente del banco.
- No asumir que `detail` está en GA4 porque aparezca en la URL.
- No pegar un deeplink `scotiabankpe:///...` directamente en emails y QR como si fuera una URL HTTPS universal.
- No publicar la opción Clientes / No clientes hasta que el mecanismo esté implementado y probado por Tecnología.

**Regla final:** la herramienta construye el enlace; Marketing y Analytics comprueban etiquetado y destino; Tecnología confirma el comportamiento de App, login y fallback.
