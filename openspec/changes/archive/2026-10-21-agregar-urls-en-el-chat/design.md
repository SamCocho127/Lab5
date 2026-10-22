## Context

Ver `proposal.md` para el motivo. Hoy `server.js` pasa cada evento `Evento-Mensaje-Server` por `unalib.validateMessage` y reenvía el JSON. El cliente en `index.html` pinta `mensaje` con `.html()`, así que una etiqueta ya validada se ve en la lista. `unalib.js` ya distingue algunas imágenes y URLs de YouTube, pero la imagen no exige que todo el mensaje sea la URL, el video directo no tiene reproductor, y las pruebas no describen la publicación en el chat.

El payload sigue siendo un JSON con `nombre`, `mensaje` y `color`. No hay persistencia.

## Goals / Non-Goals

**Goals:**

- Clasificar el texto completo del mensaje, ya recortado, como imagen, YouTube, archivo de video o texto.
- Publicar una imagen, un reproductor de YouTube o un reproductor con controles, según el caso.
- Mantener el filtro de inyección de script antes de cualquier conversión a HTML.
- Cubrir los escenarios de `specs/chat-url-media/spec.md` con pruebas BDD en Mocha.

**Non-Goals:**

- Extraer una URL que venga mezclada con otra frase.
- Reproducir videos de Vimeo, TikTok u otros sitios.
- Aceptar `javascript:`, `data:` o URLs sin esquema `http`/`https`.
- Cambiar el nombre del evento de socket ni la validación de teléfonos.

## Decisions

### Clasificar en el servidor, no en el cliente

La decisión ocurre dentro de `validateMessage`, que el servidor ya llama antes de emitir. El cliente solo pinta el HTML resultante.

Alternativa considerada: detectar la URL en `index.html` al enviar. Se descarta porque el filtro de script y el HTML quedarían en el navegador, y otro cliente podría saltárselos.

### El mensaje entero tiene que ser la URL

Se recortan espacios y el resto de la cadena debe coincidir con una sola URL de medio. Si la URL va dentro de una frase, el mensaje se publica como texto.

Alternativa considerada: buscar la primera URL dentro del texto y sustituirla. Se descarta porque cambiaría frases que solo mencionan un enlace y no está en los escenarios.

### Tres salidas de medio

- Imagen (`jpg`, `jpeg`, `png`, `gif`, `bmp`, `webp`): etiqueta `img` con la URL recortada.
- YouTube (`watch?v=`, `youtu.be/`, `embed/`): `iframe` cuyo `src` usa solo el identificador de 11 caracteres.
- Archivo (`mp4`, `webm`, `ogg`, `ogv`, `mov`): etiqueta `video` con `controls` y esa URL.

La imagen se evalúa antes que el video. Una URL no puede terminar a la vez en una extensión de imagen y en una de video.

Alternativa considerada: dejar el video solo en YouTube, como hace el código actual. Se descarta porque un `.mp4` también es un video y el escenario pide un reproductor con controles.

### El HTML se arma con la URL ya aceptada

La etiqueta usa la URL que pasó la clasificación, o el identificador de YouTube, con los caracteres de atributo escapados. No se concatena el mensaje crudo.

Alternativa considerada: insertar `obj.mensaje` directo en `src`, como `getImageTag` hoy. Se descarta porque una coincidencia parcial puede romper el atributo.

### Orden de decisión

1. Payload vacío o no texto: mensaje vacío.
2. JSON inválido: se conserva el texto recibido, sin convertirlo en medio.
3. Inyección de script: `mensaje` queda vacío.
4. Imagen, luego YouTube, luego archivo de video.
5. Cualquier otro caso: el texto original se conserva.

### Pruebas

Los escenarios se escriben con `describe` / `it` sobre `validateMessage` y los predicados de URL. No se agrega otro framework. Las pruebas de teléfono existentes se dejan igual.

## Risks / Trade-offs

- [Una extensión en la ruta no garantiza el tipo de contenido] → Se clasifica por la URL, que es lo que el chat puede saber sin descargar el archivo.
- [El cliente pinta HTML] → Solo se emite HTML construido tras la clasificación; el nombre y el color siguen el camino que ya tenían.
- [YouTube cambia formatos de URL] → Se cubren watch, corto y embed. Otras formas quedan como texto.
- [`getYTVideoId` hoy puede fallar si la expresión no coincide] → La extracción devuelve vacío cuando no hay identificador, y el mensaje sigue como texto.

## Migration Plan

No hay datos guardados. Al reiniciar `node server.js` los mensajes nuevos usan la clasificación. Para volver atrás basta restaurar `libs/unalib.js`, `index.html` y `test/test.js`.
