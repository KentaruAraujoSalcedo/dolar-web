# Solicitudes listas para Marketing · Asistente v3.4.1

Estas son frases de ejemplo. Copia una y modifica el producto, la campaña o los valores. No necesitas aprender el formato de `embeddedURL`.

## 1. Producto sin UTM + App/Login Web

> Quiero crear un enlace para Compra de Deuda Extra Línea, sin UTM, que intente abrir la App de Scotiabank o muestre el login web. No agregues parámetros adicionales.

También puedes escribir «compra de deuda», pero el asistente debe mostrar una **coincidencia sugerida** y pedir confirmación, ya que no sabe si te refieres exactamente a «Extra Línea».

## 2. Campaña Meta Ads

> Quiero un enlace de Meta Ads para Para ti. Que intente abrir la App y, sin ella, utilice el login web. utm_campaign=tc_beneficios_tactica_conversion y utm_content=boton_principal.

El catálogo sugiere `utm_source=meta` y `utm_medium=paid-social`. Confirma que coincidan con la taxonomía vigente de Analytics.

## 3. Solo Web sin UTM + parámetros propios

> Quiero un enlace interno de la web del banco para Para ti, solo Web, sin UTM, con source=campaign y detail=boton_principal.

Esto **no** crea UTM; `source` y `detail` necesitan instrumentación para verse como dimensiones en GA4.

## 4. Solo App (nativo)

> Quiero un enlace Solo App a scotiabankpe:///exchange sin UTM.

No hay fallback Web garantizado para deeplinks directos.

## 5. WebView App + Google Ads

> En Google Ads necesito abrir la ruta /u/term/term-deposit/close/init dentro de la App mediante WebView y, por Web, pasar por el login. utm_campaign=depositos_plazo_tactica_conversion.

La construcción del formato no valida que la ruta funcione en la App.

## 6. Browser App

> Necesito un enlace Solo App tipo Browser que abra https://www.scotiabank.com.pe/ dentro de la función browser de la App. Sin UTM.

La URL HTTPS debe ser un destino autorizado y verificarse en dispositivos reales.

## 7. Email con UTM manuales

> Quiero enviar por correo un enlace Solo Web a https://www.scotiabank.com.pe/. utm_source=masterbase utm_medium=email utm_campaign=tc_comprasexterior-millas_tactica_conversion utm_content=todos cliente=true utm_canal=email.

`cliente` y `utm_canal` son parámetros personalizados, no dimensiones estándar automáticas de GA4. Nunca incluyas datos personales.

## 8. Clientes y no clientes (solo para Tecnología)

> En una campaña de correo necesito que el cliente vaya a una pantalla autenticada de la App o login web, y el no cliente a una landing pública. Quiero dejar las tres rutas para Tecnología.

Esta opción **no genera enlaces publicables** hasta tener una integración real de selección del destino.

## Cómo pedir bien el enlace

Lo más útil es indicar **destino**, **modalidad** (Solo Web, Solo App, App o login Web), **canal** si hay UTM, y **medición** (sin UTM o valores de UTM/source/detail). Si el catálogo no reconoce la ruta, el asistente no la inventará: tendrás que elegirla o pegarla. Siempre revisa la URL final antes de compartirla.
