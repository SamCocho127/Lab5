# chat-experience Specification

## Purpose

Hace más claro el uso del chat: el encabezado, la lista y el formulario se leen con comodidad, un mensaje vacío no se publica, y los medios ya aceptados caben en el ancho de la conversación.

## Requirements

### Requirement: Encabezado y lista por encima del formulario
El chat SHALL mostrar un encabezado con el nombre del chat. La lista de mensajes SHALL permanecer por encima del formulario, de modo que el formulario no tape el último mensaje.

#### Scenario: Página recién abierta
- **GIVEN** el usuario abre el chat
- **WHEN** la página termina de mostrarse
- **THEN** se ve un encabezado con el nombre del chat y la lista de mensajes queda por encima del formulario

### Requirement: Aviso para pegar una URL
El campo de mensaje SHALL invitar a pegar una URL. Junto al formulario SHALL verse un aviso de que un mensaje que es solo una URL de imagen o de video se muestra en el chat.

#### Scenario: Aviso visible
- **GIVEN** el usuario está en el chat
- **WHEN** mira el formulario
- **THEN** el campo de mensaje invita a pegar una URL y se ve el aviso sobre imágenes y videos

### Requirement: No publicar un mensaje vacío
El chat SHALL NOT publicar un mensaje cuyo texto está vacío o contiene solo espacios. En ese caso el chat SHALL dejar el texto en el campo.

#### Scenario: Campo vacío
- **GIVEN** el campo de mensaje está vacío
- **WHEN** el usuario envía el formulario
- **THEN** no aparece un mensaje nuevo y el campo sigue vacío

#### Scenario: Solo espacios
- **GIVEN** el campo de mensaje contiene solo espacios
- **WHEN** el usuario envía el formulario
- **THEN** no aparece un mensaje nuevo y los espacios siguen en el campo

### Requirement: Nombre ausente
El chat SHALL publicar el mensaje con el nombre Anónimo cuando el campo de nombre está vacío.

#### Scenario: Envío sin nombre
- **GIVEN** el campo de nombre está vacío y el mensaje es `hola`
- **WHEN** el usuario envía el formulario
- **THEN** el mensaje publicado muestra Anónimo y el texto `hola`

### Requirement: Un mensaje con texto se sigue publicando
El chat SHALL publicar un mensaje cuyo texto no está vacío y SHALL vaciar el campo de mensaje después de enviarlo. El texto publicado SHALL conservar el nombre y el mensaje.

#### Scenario: Texto de Ana
- **GIVEN** el nombre es Ana y el mensaje es `hola equipo`
- **WHEN** el usuario envía el formulario
- **THEN** la lista muestra `Ana: hola equipo` y el campo de mensaje queda vacío

### Requirement: Medios dentro del ancho del chat
Una imagen, un reproductor de YouTube o un reproductor de video publicado en la lista SHALL caber en el ancho visible de la lista y SHALL NOT desbordarla en horizontal.

#### Scenario: Imagen publicada
- **GIVEN** el usuario envía una URL de imagen
- **WHEN** la imagen aparece en la lista
- **THEN** su ancho no supera el ancho de la lista
