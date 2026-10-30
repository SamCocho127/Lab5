# UNA Chat

UNA Chat es un chat local en tiempo real con Express y Socket.IO. Requiere una sesión social de Google administrada por Auth0 y conserva el envío de texto, imágenes, videos de YouTube y archivos de video.

## Requisitos

- Node.js `22.12.0` o posterior dentro de la línea 22 (el proyecto fue verificado con Node 22.20).
- npm.
- Una aplicación Auth0 de tipo **Regular Web Application**.
- La conexión social `google-oauth2` habilitada para esa aplicación.

El alcance acordado es exclusivamente `http://localhost:3000`. Vercel, dominios de producción, Redis, pub/sub e infraestructura distribuida están fuera de alcance.

## Instalación

```sh
npm ci
```

No se usa `rsc-harness`.

## Configuración de Auth0

En la aplicación de Auth0 configura exactamente:

- Allowed Callback URLs: `http://localhost:3000/callback`
- Allowed Logout URLs: `http://localhost:3000`
- Allowed Web Origins: `http://localhost:3000`
- Cross-Origin Authentication: desactivado.
- Connection: `google-oauth2` habilitada para la aplicación.

La ruta `/login` inicia Universal Login solicitando esa conexión social. Auth0 devuelve el navegador a `/callback`; después de establecer la sesión, UNA Chat conduce a `/chat`.

## Variables de entorno

Copia `.env.example` como `.env` y reemplaza únicamente los marcadores en el archivo local:

```dotenv
PORT=3000
BASE_URL=http://localhost:3000
ISSUER_BASE_URL=https://tu-tenant.auth0.com
CLIENT_ID=tu_client_id
SECRET=genera_un_secreto_aleatorio
```

Genera un `SECRET` aleatorio con:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`SECRET` protege la cookie de sesión y no es el Client Secret de Auth0. `.env` y sus variantes están ignorados por Git; `.env.example` contiene solo marcadores y sí se versiona.

## Ejecución local

```sh
npm start
```

Abre `http://localhost:3000`, selecciona **Continuar con Google** y completa Universal Login. La ruta `/chat` y `/api/me` requieren sesión. El campo `#nombre` muestra la identidad Auth0 como solo lectura; el servidor ignora cualquier nombre enviado por el navegador.

Para cerrar la sesión usa **Cerrar sesión**. El servidor desconecta los sockets de esa identidad antes de delegar el logout al SDK y volver a la página pública.

## Pruebas

Las pruebas automatizadas usan un runtime falso aislado bajo `test/`; nunca contactan Auth0 ni habilitan un bypass en el arranque de producción.

```sh
npm test
npm run test:integration
npm run test:e2e
npm run test:all
```

- Mocha: validación, configuración e identidad.
- Jest: rutas protegidas, sockets, suplantación, logout, reconexión y regresiones del chat.
- Playwright: interfaz pública y autenticada en un navegador visible.
- `test:all`: Mocha y Jest; Playwright se ejecuta por separado.

## Seguridad

- `express-openid-connect` administra OIDC y una sesión cifrada y firmada en cookie HTTP-only.
- El handshake Socket.IO usa la misma sesión; una conexión anónima se rechaza.
- El servidor obtiene la identidad desde Auth0 y sustituye `msg.nombre`.
- Los datos del perfil se normalizan; el nombre y el texto ordinario se escapan antes de insertarse como HTML.
- Las etiquetas de imagen y video se construyen únicamente con URLs HTTP(S) aceptadas.
- No se registran tokens, cookies, credenciales ni valores de `.env`.

## Solución de problemas

### Callback mismatch

Comprueba que Auth0 tenga `http://localhost:3000/callback` exactamente, sin cambiar host, puerto ni ruta. `localhost` y `127.0.0.1` no son intercambiables para callbacks.

### Variables faltantes

El servidor no inicia si falta una variable obligatoria o si `PORT`, las URLs o `SECRET` no son válidos. El error muestra únicamente los nombres de las variables afectadas, nunca sus valores.

### Cookies o bucle de login

- Accede siempre mediante `http://localhost:3000`.
- Borra cookies antiguas de localhost si cambiaste `SECRET`.
- Verifica que el reloj del equipo sea correcto.
- No mezcles una pestaña en `localhost` con otra en `127.0.0.1`.

### Socket.IO indica sesión inválida

Recarga la página e inicia sesión otra vez. El logout desconecta deliberadamente los sockets anteriores y estos no pueden reutilizarse.

### Cancelación o error de Auth0

La aplicación vuelve a la página pública con un mensaje genérico y permite reintentar. Los detalles externos del error no se muestran para evitar filtrar información interna.
