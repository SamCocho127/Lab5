## Purpose

Permite que un mensaje del chat cuyo texto es una URL de imagen o de video se publique como imagen o como reproductor, y que el resto de los mensajes siga viéndose como texto.

## ADDED Requirements

### Requirement: Imagen en el chat
El chat SHALL mostrar una imagen cuando el texto del mensaje, ignorando espacios al inicio y al final, es únicamente una URL `http` o `https` cuya ruta termina en `jpg`, `jpeg`, `png`, `gif`, `bmp` o `webp`. La comparación de la extensión SHALL ser insensible a mayúsculas. Una query o un fragmento opcionales después de la extensión SHALL seguir contando como URL de imagen. El elemento publicado SHALL usar esa URL como origen de la imagen.

#### Scenario: URL jpg
- **GIVEN** un mensaje cuyo texto es `http://image.com/image.jpg`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje muestra una imagen cuyo origen es `http://image.com/image.jpg`

#### Scenario: URL gif
- **GIVEN** un mensaje cuyo texto es `http://image.com/image.gif`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje muestra una imagen cuyo origen es `http://image.com/image.gif`

#### Scenario: URL png con https y extensión en mayúsculas
- **GIVEN** un mensaje cuyo texto es `https://cdn.example.com/foto.PNG`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje muestra una imagen cuyo origen es `https://cdn.example.com/foto.PNG`

#### Scenario: URL jpeg, bmp o webp
- **GIVEN** un mensaje cuyo texto es `https://cdn.example.com/a.jpeg`, `https://cdn.example.com/b.bmp` o `https://cdn.example.com/c.webp`
- **WHEN** el chat publica el mensaje
- **THEN** cada mensaje muestra una imagen cuyo origen es esa misma URL

#### Scenario: URL de imagen con query
- **GIVEN** un mensaje cuyo texto es `https://cdn.example.com/foto.jpg?size=large`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje muestra una imagen cuyo origen es `https://cdn.example.com/foto.jpg?size=large`

#### Scenario: Espacios alrededor de la URL
- **GIVEN** un mensaje cuyo texto es `  http://image.com/image.jpg  `
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje muestra una imagen cuyo origen es `http://image.com/image.jpg`

### Requirement: Reproductor de YouTube
El chat SHALL insertar un reproductor de YouTube cuando el texto del mensaje, ignorando espacios al inicio y al final, es únicamente una URL `http` o `https` de un video de YouTube. Las formas aceptadas SHALL ser `youtube.com/watch` con el parámetro `v`, `youtu.be/<id>` y `youtube.com/embed/<id>`, con `www` opcional. El identificador SHALL tener 11 caracteres. El reproductor SHALL reproducir ese identificador y SHALL ignorar parámetros extra de la URL.

#### Scenario: URL watch
- **GIVEN** un mensaje cuyo texto es `https://www.youtube.com/watch?v=qYwlqx-JLok`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje inserta un reproductor de YouTube del video `qYwlqx-JLok`

#### Scenario: URL corta youtu.be
- **GIVEN** un mensaje cuyo texto es `https://youtu.be/qYwlqx-JLok`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje inserta un reproductor de YouTube del video `qYwlqx-JLok`

#### Scenario: URL embed
- **GIVEN** un mensaje cuyo texto es `https://www.youtube.com/embed/qYwlqx-JLok`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje inserta un reproductor de YouTube del video `qYwlqx-JLok`

#### Scenario: URL watch con parámetros extra
- **GIVEN** un mensaje cuyo texto es `https://www.youtube.com/watch?v=qYwlqx-JLok&t=30`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje inserta un reproductor de YouTube del video `qYwlqx-JLok`

### Requirement: Reproductor de archivo de video
El chat SHALL insertar un reproductor de video cuando el texto del mensaje, ignorando espacios al inicio y al final, es únicamente una URL `http` o `https` cuya ruta termina en `mp4`, `webm`, `ogg`, `ogv` o `mov`. La comparación de la extensión SHALL ser insensible a mayúsculas. Una query o un fragmento opcionales SHALL seguir contando como archivo de video. El reproductor SHALL usar esa URL como origen y SHALL ofrecer controles de reproducción.

#### Scenario: URL mp4
- **GIVEN** un mensaje cuyo texto es `https://cdn.example.com/clip.mp4`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje inserta un reproductor con controles cuyo origen es `https://cdn.example.com/clip.mp4`

#### Scenario: URL webm, ogg u ogv
- **GIVEN** un mensaje cuyo texto es `https://cdn.example.com/clip.webm`, `https://cdn.example.com/clip.ogg` o `https://cdn.example.com/clip.ogv`
- **WHEN** el chat publica el mensaje
- **THEN** cada mensaje inserta un reproductor con controles cuyo origen es esa misma URL

#### Scenario: URL mov con query
- **GIVEN** un mensaje cuyo texto es `http://cdn.example.com/clip.MOV?dl=1`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje inserta un reproductor con controles cuyo origen es `http://cdn.example.com/clip.MOV?dl=1`

### Requirement: Texto y URLs que no son medio
El chat SHALL publicar el texto original, sin imagen ni reproductor, cuando el mensaje no es únicamente una URL de imagen ni únicamente una URL de video.

#### Scenario: Texto plano
- **GIVEN** un mensaje cuyo texto es `hola equipo`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje muestra `hola equipo` y no contiene una imagen ni un reproductor

#### Scenario: URL de una página
- **GIVEN** un mensaje cuyo texto es `https://example.com/pagina`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje muestra `https://example.com/pagina` y no contiene una imagen ni un reproductor

#### Scenario: URL de imagen dentro de una frase
- **GIVEN** un mensaje cuyo texto es `mira http://image.com/image.jpg`
- **WHEN** el chat publica el mensaje
- **THEN** el mensaje muestra el texto original y no lo reemplaza por una imagen

### Requirement: Inyección de script
El chat SHALL vaciar el texto del mensaje cuando contiene una inyección de script, y SHALL NOT mostrarlo como imagen ni como reproductor.

#### Scenario: Etiqueta script
- **GIVEN** un mensaje cuyo texto contiene una etiqueta script
- **WHEN** el chat publica el mensaje
- **THEN** el texto publicado queda vacío y no contiene una etiqueta script
