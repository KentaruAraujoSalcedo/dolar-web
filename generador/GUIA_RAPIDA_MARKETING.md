# Guía rápida para Marketing · Generador v3.2

## ¿Por dónde empiezo?

1. Abre **Crear enlace**.
2. Elige **dónde se compartirá** y **qué quieres que abra**. Pulsa **Continuar al paso 2**.
3. En **Destino**, pega la URL Web o el deeplink App. Si no los conoces, usa **Buscar en el catálogo**. Si están sin configurar, ve a **Configurar un destino nuevo** y regresa con **Guardar rutas y volver al generador**.
4. En **Medición**, revisa las UTM sugeridas. Puedes escribir `source` y `detail` libremente; no son UTM y no las modifican. Si dejas `source` vacío, no se incluye. Pulsa **Continuar al paso 4**.
5. Pulsa **Generar enlace**. La URL aparece justo debajo. Cópiala, pruébala y solo entonces compártela.

## Ejemplo: botón dentro de una landing del banco

Selecciona «Dentro de la web del banco» y «Abrir una página web». En Destino coloca la URL Web aprobada. En Medición no agregues UTM nuevas; puedes escribir `source=landing` y `detail=boton_principal` si el destino permite esos datos. El generador crea automáticamente los separadores de parámetros y conserva los datos técnicos necesarios de la URL.

## Ejemplo: anuncio de Meta con App o login Web

Selecciona «Meta Ads» y «Abrir App o login Web». Completa la URL Web de login con su `redirectTo` y el deeplink App que proporcionó Tecnología. En Medición se sugieren las UTM según `campanas.json`; escribe el nombre real de campaña y, opcionalmente, `utm_content`. `source` y `detail` son independientes de las UTM. En Resultado revisa `embeddedURL` desde «Ver variantes técnicas». **Prueba el resultado en Android y iOS**: puede haber diferencias según el navegador y la sesión.

## Ejemplo: App solamente

Selecciona «Abrir solo la App». Solo necesitas el deeplink App. La URL generada es un esquema de aplicación; puede no funcionar al compartirse en algunos emails, navegadores o códigos QR. No tiene fallback web garantizado.

## Ejemplo: Clientes / No clientes

La opción permite preparar la ruta de cliente Web, el deeplink App y la landing de no clientes. El generador ofrece una ficha para Tecnología y **bloquea la copia para publicación**, porque no existe aquí un mecanismo que detecte automáticamente si el usuario es cliente.

## Antes de publicar

Comprueba que el destino abre correctamente, que las UTM coinciden con la convención de Analytics, que `source` y `detail` son aceptados y, si hay App, que se comporta correctamente en los dispositivos reales. No asumas que estos parámetros se medirán en GA4 por el solo hecho de incluirlos en una URL.
