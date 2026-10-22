# Buenas prácticas de esta sesión

## TL;DR

- Primero se especifica el comportamiento (OpenSpec, estilo BDD) y después se escribe código.
- Cada cambio conserva lo que ya está cubierto por pruebas: selectores, textos y el contrato del socket.
- La lógica de medios vive en el servidor; la página solo pinta el HTML ya validado.
- Hay tres niveles de prueba: Mocha (unidad), Jest (socket) y Playwright (navegador).
- Una URL de imagen o video cuenta solo si el mensaje completo, ya recortado, es esa URL.
- El HTML de una imagen o un video se arma con la URL aceptada, no con el mensaje crudo.
- Las dependencias se fijan a versiones parcheadas y `snyk test` debe quedar sin hallazgos críticos ni altos.
- En git entra el código y las specs. `.gitignore` solo deja fuera dependencias, informes de prueba y secretos.

## Especificar antes de implementar

Un cambio de comportamiento pasa por OpenSpec en este orden: propuesta, spec, diseño, tareas, implementación, pruebas y archivo.

- La spec describe lo observable con `SHALL` y escenarios `GIVEN` / `WHEN` / `THEN`.
- El diseño explica el cómo y deja fuera lo que no se va a cambiar.
- Las tareas son casillas `- [ ]` y se marcan al terminar cada una.
- Al archivar, los requisitos nuevos se copian a `openspec/specs/` sin los encabezados `ADDED` / `MODIFIED`.

## No romper el contrato que ya leen las pruebas

Al cambiar la interfaz, se mantienen estos anclajes:

- Identificadores `#nombre`, `#m` y `#messages`.
- El botón sigue llamándose `Send`.
- El placeholder del mensaje sigue conteniendo `pegue una URL`.
- El mensaje publicado se inserta con `.html(mensajeDisplay)` y el texto visible conserva la forma `Nombre: mensaje`.
- El aviso de ayuda va fuera de `#messages`, para no mezclarse con el texto de los mensajes.

## Dónde vive cada decisión

- `libs/unalib.js` clasifica el mensaje: script, imagen, YouTube, archivo de video o texto.
- `server.js` valida y reenvía. Solo abre el puerto cuando se arranca con `node server.js`, para que las pruebas puedan usar un puerto libre.
- `index.html` pinta el HTML recibido. Ahí también se rechaza un mensaje vacío, porque ese texto no debe salir del navegador.

## Mensajes y medios

- Se recortan solo los espacios de los extremos para decidir si el mensaje está vacío o si es una URL.
- Un mensaje con texto real se envía tal como lo escribió la persona.
- Imagen: `http` o `https` y extensión `jpg`, `jpeg`, `png`, `gif`, `bmp` o `webp`.
- Video: YouTube (`watch`, `youtu.be`, `embed`) o archivo `mp4`, `webm`, `ogg`, `ogv`, `mov`.
- Una URL dentro de una frase sigue siendo texto.
- Una inyección de script se vacía y no se convierte en medio.
- Los atributos HTML se escapan. El reproductor de YouTube usa solo el identificador de 11 caracteres.

## Pruebas

- Unidad: `npm test` (Mocha sobre `libs/unalib.js`).
- Integración: `npm run test:integration` (Jest y Socket.IO, con el servidor en un puerto efímero).
- Extremo a extremo: `npm run test:e2e` (Playwright, navegador visible, `slowMo: 1000`).
- Un caso nuevo de interfaz se cubre en el navegador sin borrar los casos de imagen, video, texto y script.
- Chromium de Playwright tiene que estar en `%LOCALAPPDATA%\ms-playwright`. Si falta, `npx playwright install chromium`.

## Dependencias

- No dejar rangos `*` en paquetes que ya tuvieron un fallo de seguridad.
- Subir el paquete directo cuando con eso se actualizan sus dependencias.
- Si el rango del paquete padre no admite el parche, fijarlo en `overrides`.
- Volver a correr `npx snyk test` y las suites unitaria y de integración después de actualizar.

## Qué va en git

`.gitignore` ya cubre lo que esta sesión genera y no debe versionarse:

- `node_modules`
- `test-results/`
- `playwright-report/`
- `blob-report/`
- archivos `.env`

Sí se versiona el resto del trabajo:

- `agent.md`
- `e2e/`
- `integration/`
- `openspec/`
- `playwright.config.js`
- `package-lock.json`
