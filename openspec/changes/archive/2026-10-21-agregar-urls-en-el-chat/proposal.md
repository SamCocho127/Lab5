## Why

El chat solo trata el texto como texto plano. Quien pega una URL de imagen o de video no ve el medio en la conversación, aunque el campo de mensaje ya acepta cualquier cadena. Hace falta reconocer esas URLs y mostrarlas como imagen o como reproductor.

## What Changes

- El mensaje enviado desde el campo de texto se clasifica antes de publicarse en el chat.
- Una URL de imagen se muestra como imagen dentro del mensaje.
- Una URL de video (YouTube o archivo de video directo) se muestra con un reproductor.
- El texto que no es un medio, y las URLs que no son imagen ni video, se publican sin transformar.
- Un mensaje con inyección de script se vacía y no se convierte en medio.
- El comportamiento queda descrito con escenarios BDD y cubierto por pruebas automatizadas.

## Capabilities

### New Capabilities

- `chat-url-media`: detectar URLs de imagen y de video en un mensaje del chat y devolver el HTML correspondiente para mostrarlo.

### Modified Capabilities

- Ninguna. No hay specs previas en `openspec/specs/`.

## Impact

- `libs/unalib.js`: clasificación de URLs y armado de las etiquetas de imagen y de video.
- `test/test.js`: escenarios BDD de imagen, video, texto y bloqueo de script.
- `index.html`: el listado del chat sigue insertando el HTML ya validado para que la imagen y el reproductor se vean.
- `server.js`: sigue validando cada mensaje antes de reenviarlo; no cambia el contrato del socket.
