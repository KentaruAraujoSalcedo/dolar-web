# Guía rápida para Marketing · Generador de Links v3.0

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

### Ejemplos guiados

**A. Banner interno de Gratificación → Cuenta Digital (Open Market)**

1. Canal: **Dentro de la web del banco**.
2. Objetivo: **Abrir una página web**.
3. Pulsa el preset **Cuenta Digital** del Paso 2.
4. Comprueba: URL HTTPS de Open Market, sin UTM, `detail=gratificacion_cuenta_digital`, `source=campaign` opcional.
5. Genera, prueba y manda a Marketing solo tras validación de Open Market.

**B. Anuncio de Meta → landing de Gratificación**

1. Canal: **Meta Ads**. La app sugiere `utm_source=meta` y `utm_medium=paid-social` según el catálogo.
2. Objetivo: **Abrir una página web**.
3. Destino: pega tu landing HTTPS.
4. Medición: escribe `utm_campaign` según tu nomenclatura. Si lo necesitas, añade `utm_content` para distinguir el anuncio.
5. Genera y comprueba las UTM.

**C. Email → flujo combinado App / Login Web**

1. Canal: **Email / CRM**. Se sugieren `masterbase` y `email`.
2. Objetivo: **App instalada / Login Web**.
3. Pega URL Web de login con `redirectTo` válido y deeplink `scotiabankpe:///...` ya validado.
4. Completa UTM y genera.
5. Prueba **desde el correo real** en Android/iOS, con y sin App. No prometas que abrirá App automáticamente en todos los dispositivos.

**D. Soy cliente → Para ti**

1. Canal: **Dentro de la web del banco**.
2. En Paso 2 pulsa **Usar ejemplo Soy cliente**.
3. El generador carga Web `/u/marketplace` y App `scotiabankpe:///notices`.
4. Revisa el `detail=gratificacion_soy_cliente` y `source=campaign` opcional.
5. Verifica la pantalla real de la App antes de publicar.

**E. Si no es cliente → landing comercial**

1. Selecciona **Clientes / No clientes**.
2. Indica la ruta Web y App de clientes y la URL pública de no clientes.
3. Genera y haz clic en **Descargar ficha JSON**.
4. Comparte la ficha con Tecnología: **la derivación automática todavía no funciona**. No publiques el enlace candidato.

### Errores que hay que evitar

- No usar `utm_source=web` en un botón interno solo para rastrearlo: cambia o fragmenta la atribución.
- No confundir `source=campaign` con `utm_source`: son parámetros distintos.
- No creer que `embeddedURL` significa que existe detección perfecta de App instalada.
- No creer que tener App instalada equivale a ser cliente del banco.
- No asumir que `detail` está en GA4 porque aparezca en la URL.
- No pegar un deeplink `scotiabankpe:///...` directamente en emails y QR como si fuera una URL HTTPS universal.
- No publicar la opción Clientes / No clientes hasta que el mecanismo esté implementado y probado por Tecnología.

**Regla final:** la herramienta construye el enlace; Marketing y Analytics comprueban etiquetado y destino; Tecnología confirma el comportamiento de App, login y fallback.
