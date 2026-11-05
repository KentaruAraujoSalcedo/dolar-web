# Requisitos técnicos pendientes · Generador v3.2

## Escenario clientes / no clientes

La herramienta puede **preparar**, pero no ejecutar, un enrutamiento condicional basado en la condición real de cliente. Se registran:

1. URL Web de clientes (por ejemplo, `/login?redirectTo=/u/...`).
2. Deeplink App de clientes.
3. Landing pública alternativa de no clientes.
4. Canal, UTM, `source` y `detail`, si aplican.

El botón de publicación queda deshabilitado en esta modalidad. La ficha JSON exportable contiene las rutas y el estado `PENDIENTE_DE_TECNOLOGIA_NO_PUBLICABLE`.

La detección de App instalada **no permite inferir** si una persona es cliente. Se necesita una decisión de autenticación o enrutamiento realizada por la infraestructura del banco. No añadir un supuesto `fallbackURL` a `/login` sin una especificación implementada y validada.

## Escenario App o login Web

El generador combina la URL Web con `embeddedURL=...` codificado una sola vez. Su funcionamiento requiere que el servidor / login reconozca el parámetro y que la App admita el deeplink indicado. Esta construcción no es equivalente a Android App Links o iOS Universal Links verificados y no garantiza que todos los navegadores se comporten igual.

## Parámetros extras source/detail

Se añaden solo cuando sus campos contienen valores. Son independientes de `utm_source`, `utm_medium` y otras UTM. La App y el sitio deben determinar si dichos parámetros están permitidos, si se preservan tras autenticación y cuáles eventos los envían a GA4/Firebase/BigQuery.

## QA solicitado a Tecnología

Verificar, en Android e iOS, App instalada/no instalada, sesión iniciada/cerrada y los tres tipos de destino. Probar fallback, restricciones del navegador, mensajes de correo, enlaces internos y la recepción real de parámetros en la medición. Validar HTTPS y políticas de seguridad para las rutas de producción.
