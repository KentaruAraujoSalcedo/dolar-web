# Pendientes de Tecnología · Generador v3.3

## 1. Web + App

Confirmar qué endpoints de Scotiabank permiten `embeddedURL` y qué ocurre **en cada canal** cuando la App no está instalada. `redirectTo=/u/...` es una ruta web dentro de `/login`; **no implica** fallback a una landing pública. Validar Android e iOS, navegador web normal, navegación desde Meta/Google, correo, WhatsApp y QR.

## 2. Clientes / No clientes

El generador registra destinos Web y App para clientes y una landing comercial para no clientes. **No implementa** detección cliente/no cliente. Se necesita una solución corporativa que identifique al cliente con autorización y proteja los flujos de autenticación. La copia de la URL de propuesta se bloquea hasta su validación. Verificar comportamiento de clientes sin App, no clientes con App y rutas públicas.

## 3. Deeplinks

Revisar y documentar rutas compatibles:

- Nativo: `scotiabankpe:///exchange`
- WebView: `scotiabankpe:///webView?path=/u/campaign;code=CF`
- Browser: `scotiabankpe:///browser?url=` + URL HTTPS codificada

Confirmar que Browser interpreta la URL codificada, qué navegadores interiores emplea y si conserva la query de la página. Confirmar qué parámetros externos a WebView son reenviados al contenido y qué rutas necesitan login.

## 4. Medición

Definir contrato de parámetros aprobados en `source`, `detail`, `cliente`, `utm_canal` y extras; establecer qué se registra en eventos Web/GA4 (GTM) y App/Firebase y qué se exporta a BigQuery. El generador sólo construye las URLs. Evitar introducir datos personales o sensibles en la cadena de consulta.
