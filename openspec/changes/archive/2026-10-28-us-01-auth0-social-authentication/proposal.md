## Why

UNA Chat permite hoy entrar y publicar con cualquier nombre enviado por el navegador, por lo que no existe una identidad confiable ni control de acceso. US-01 requiere autenticación social con Google mediante Auth0 para que solo una sesión válida pueda abrir el chat y publicar con la identidad establecida por el servidor.

## What Changes

- Agregar autenticación local con Auth0 y la conexión social `google-oauth2`, usando variables de entorno y el SDK oficial `express-openid-connect`.
- Mostrar una página pública previa al login y proteger la página del chat, el callback, logout y los flujos de error/reintento apropiados.
- Proteger el handshake y los eventos de Socket.IO con la sesión Auth0; un socket sin identidad válida se rechaza y un socket anterior deja de publicar después del logout.
- Derivar el nombre visible exclusivamente de la sesión Auth0, conservar `#nombre` como solo lectura y sustituir cualquier `msg.nombre` falsificado en el servidor.
- Escapar la identidad y los datos visibles controlados por usuarios sin romper texto, imágenes, YouTube, archivos de video ni el filtro de scripts.
- Agregar pruebas aisladas del servicio real, `.env.example` y documentación completa para ejecutar y diagnosticar el flujo local.
- Limitar el alcance a `http://localhost:3000`; Vercel, Redis, pub/sub, infraestructura distribuida y `rsc-harness` quedan fuera de alcance.

## Capabilities

### New Capabilities

- `social-authentication`: login social con Auth0/Google, sesión local, rutas protegidas, identidad confiable, protección de Socket.IO, logout y errores recuperables.

### Modified Capabilities

- `chat-experience`: sustituir el nombre editable o anónimo por la identidad autenticada visible y de solo lectura, manteniendo los selectores y la presentación `Nombre: mensaje`.

## Impact

- `server.js`, `index.html` y módulos nuevos de autenticación/identidad.
- Pruebas Mocha, Jest y Playwright, con simulaciones de autenticación separadas del código de producción.
- `package.json` y `package-lock.json` por `express-openid-connect` y carga segura de `.env`.
- `.gitignore`, `.env.example` y `README.md` para configuración local sin secretos.
- Contrato Socket.IO: conserva `Evento-Mensaje-Server` y el JSON compatible, pero el servidor pasa a ser autoritativo para `nombre` y rechaza sesiones inválidas.
