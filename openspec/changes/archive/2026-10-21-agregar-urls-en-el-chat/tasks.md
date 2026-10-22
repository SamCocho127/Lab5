## 1. Clasificación de URLs

- [x] 1.1 Exigir que una imagen sea toda la cadena recortada, con esquema http o https y extensión jpg, jpeg, png, gif, bmp o webp
- [x] 1.2 Reconocer YouTube en watch, youtu.be y embed, y devolver el identificador de 11 caracteres sin fallar si no hay coincidencia
- [x] 1.3 Reconocer un archivo de video mp4, webm, ogg, ogv o mov como URL de video

## 2. Publicación en el chat

- [x] 2.1 Aplicar en la validación del mensaje el orden script, imagen, YouTube, archivo de video y texto
- [x] 2.2 Construir img, iframe y video solo con la URL o el identificador aceptados, escapando el valor del atributo
- [x] 2.3 Dejar el campo de texto listo para una URL y seguir pintando el HTML validado en la lista del chat

## 3. Pruebas BDD

- [x] 3.1 Cubrir con escenarios los casos de imagen, YouTube, archivo de video, texto y script
- [x] 3.2 Ejecutar la suite completa y conservar en verde las pruebas de teléfono
