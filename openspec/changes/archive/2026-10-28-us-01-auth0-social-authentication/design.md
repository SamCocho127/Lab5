## Context

Ver `proposal.md` para el motivo y las specs delta para el comportamiento. Hoy `server.js` sirve un único `index.html`, acepta cualquier socket y confía en el JSON `{ nombre, mensaje, color }`; `libs/unalib.js` transforma el mensaje y el navegador inserta el resultado con `.html()`. El proyecto usa Express 4, CommonJS, Socket.IO 4 y tres niveles de pruebas. Auth0 ya tiene una Regular Web Application local con callback `/callback`, logout y origen en `http://localhost:3000`, Google habilitado y cinco variables disponibles en un `.env` ignorado.

## Goals / Non-Goals

**Goals:**

- Integrar una sesión Auth0 real sin introducir contraseñas locales ni confiar en datos de identidad del cliente.
- Compartir la autenticación HTTP con el handshake Socket.IO y cortar sockets en logout.
- Conservar los contratos de interfaz, evento y medios que cubren las pruebas existentes.
- Permitir pruebas deterministas sin contactar Auth0 y sin un bypass activable en producción.

**Non-Goals:**

- Desplegar en Vercel o configurar callbacks de producción.
- Agregar Redis, pub/sub, almacenamiento de sesiones externo o múltiples instancias.
- Migrar de CommonJS, Express 4 o JavaScript.
- Implementar autorización por roles, persistencia de usuarios o historial del chat.
- Usar el paso 3 o `rsc-harness`.

## Decisions

### Usar `express-openid-connect` como SDK oficial

Se usará `express-openid-connect`, compatible con Express 4 y CommonJS, porque coincide con las variables ya configuradas, administra login/callback/logout y cifra/firma la sesión en una cookie HTTP-only. La documentación oficial actual recomienda `@auth0/auth0-express` para proyectos Auth0 nuevos, pero `express-openid-connect` sigue soportado, es el SDK solicitado preferentemente por el laboratorio y ofrece el contrato probado por el quickstart de Express.

Alternativas consideradas: `passport` requeriría más piezas de sesión y estrategia; implementar OAuth/OIDC manualmente aumentaría el riesgo; `@auth0/auth0-express` cambiaría el API esperado y no aporta una ventaja necesaria para este alcance académico local.

### Separar construcción de aplicación y arranque de producción

`server.js` exportará una fábrica que exige un runtime de autenticación. El arranque `node server.js` cargará `.env`, validará las cinco variables y construirá exclusivamente el runtime real. Las pruebas importarán la fábrica e inyectarán un runtime falso ubicado bajo utilidades de prueba; el código de producción no tendrá bandera ni variable que habilite el falso.

Alternativa considerada: usar `NODE_ENV=test` dentro del servidor para omitir Auth0. Se descarta porque sería un bypass de producción activable accidentalmente.

### Rutas públicas y protegidas

- `/`: página pública previa al login; si ya existe sesión, redirige a `/chat`.
- `/login`: inicia Universal Login forzando `connection=google-oauth2` y retorna a `/chat`.
- `/callback`: callback administrado por el SDK.
- `/chat`: entrega `index.html` solo con sesión válida.
- `/api/me`: devuelve nombre, correo e imagen normalizados desde la sesión.
- `/logout`: desconecta sockets del sujeto y delega el cierre local/Auth0 al SDK.

La configuración usa `authRequired: false` para permitir la página pública y aplica un guard explícito a las rutas privadas. Los errores del callback llegan al manejador final, que redirige a una vista pública con un código genérico y reintento, sin reflejar descripciones externas.

### Sesión y cookies para localhost

El SDK mantiene la sesión cifrada y firmada con `SECRET`. En HTTP local la cookie será HTTP-only, `sameSite=Lax` y no `secure`; no se copiarán tokens al cliente ni a Socket.IO. El alcance de una sola instancia permite cookie-session sin Redis. Se usará logout del proveedor para evitar un relogin silencioso no deseado.

### Proteger el handshake y los eventos Socket.IO

El mismo middleware Auth0 se aplicará con `io.engine.use` únicamente al handshake inicial. Después, `io.use` exigirá `req.oidc.isAuthenticated()` y copiará una identidad normalizada a `socket.data`. Cada manejador de mensaje comprobará esa identidad; el logout desconectará todos los sockets asociados al `sub` autenticado antes de finalizar la sesión.

Alternativas consideradas: aceptar un token en `socket.handshake.auth` expone al cliente a manejar tokens; confiar solo en el handshake no corta sockets antiguos después del logout; almacenar sesiones en Redis es innecesario para una instancia local.

### Identidad del servidor y salida segura

La identidad se deriva en orden de `name`, `nickname`, `email` y un texto de respaldo, con longitud limitada. El servidor reemplaza siempre `obj.nombre`, valida el color con un patrón hexadecimal y escapa el nombre antes de emitir. La imagen de perfil solo se entrega si usa HTTPS. El texto ordinario se escapa antes de que el cliente lo inserte con `.html()`; las etiquetas de medios siguen siendo generadas únicamente por el servidor a partir de URLs aceptadas.

### Pruebas aisladas del proveedor real

Las pruebas unitarias cubrirán configuración, identidad y escape. Jest levantará la fábrica con un runtime falso que asigna perfiles fijos a cookies de prueba, y verificará rutas, sockets, suplantación, logout, reconexión, dos usuarios y regresiones de medios. Playwright arrancará un servidor fixture separado que usa el mismo runtime falso; cubrirá la interfaz pública y autenticada sin contactar Google/Auth0. La validación manual posterior será la única evidencia del proveedor real.

## Risks / Trade-offs

- [El middleware OIDC no se ejecuta correctamente en el upgrade] → Aplicarlo al handshake Engine.IO y cubrir conexión autenticada/no autenticada con Jest.
- [Una cookie local no puede revocar por sí sola un socket ya abierto] → Mantener sockets por `sub` y desconectarlos antes del logout.
- [Datos del perfil o mensaje producen HTML] → Normalizar identidad, escapar nombre/texto y conservar HTML solo para medios construidos por el servidor.
- [La configuración Auth0 real difiere de las URLs documentadas] → Validación manual obligatoria y guía de `callback mismatch` en README.
- [El SDK cambia requisitos de Node] → Confirmar el `engines` de la versión instalada contra Node 22 y fijar el lockfile.
- [La cancelación externa incluye texto no confiable] → Mostrar solo mensajes propios genéricos y nunca reflejar `error_description`.

## Migration Plan

1. Mantener `.env` ignorado y agregar `.env.example` sin valores reales.
2. Instalar dependencias fijadas por el lockfile.
3. Introducir fábrica, runtime real y runtime falso de pruebas.
4. Proteger rutas y sockets, luego adaptar la interfaz.
5. Ejecutar unidad, integración, e2e, auditorías y validación manual real.
6. Para revertir, restaurar código, dependencias y documentación; la configuración Auth0 externa puede permanecer sin uso.

El cambio se archivará únicamente después de confirmar manualmente Google, retorno, identidad, mensajes, logout, cancelación y dos sesiones. Hasta entonces permanecerá activo.
