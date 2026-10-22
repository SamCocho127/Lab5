## Why

El chat funciona, pero la pantalla es difícil de usar: el texto es pequeño, el formulario tapa los últimos mensajes y un envío vacío igual se publica. Hace falta una presentación más clara sin cambiar cómo se muestran las imágenes, los videos y el texto.

## What Changes

- La página muestra un encabezado con el nombre del chat y una lista de mensajes que permanece por encima del formulario.
- El formulario se lee y se usa con más espacio, con foco visible y un aviso de que una URL sola de imagen o de video se ve en el chat.
- Un mensaje vacío o solo con espacios no se publica y el campo de texto no se borra.
- Si el nombre está vacío, el mensaje se publica como Anónimo.
- Las imágenes, los reproductores de YouTube y los videos se ajustan al ancho del chat.
- La clasificación de URLs y el filtro de scripts siguen como están en `chat-url-media`.

## Capabilities

### New Capabilities

- `chat-experience`: presentación del chat, envío de mensajes vacíos y ajuste visual de los medios ya publicados.

### Modified Capabilities

- Ninguna. `chat-url-media` no cambia sus requisitos.

## Impact

- `index.html`: estructura visible, estilos y la decisión de no enviar un mensaje vacío.
- `e2e/chat.spec.js`: un escenario nuevo para el mensaje vacío. Los escenarios de imagen, video y texto se mantienen.
- `server.js` y `libs/unalib.js`: sin cambios de comportamiento.
