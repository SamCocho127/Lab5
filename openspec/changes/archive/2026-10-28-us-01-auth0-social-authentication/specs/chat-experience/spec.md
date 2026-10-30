## MODIFIED Requirements

### Requirement: Nombre ausente
El chat SHALL obtener el nombre desde la sesión autenticada, SHALL mostrarlo en `#nombre` como valor de solo lectura y SHALL NOT utilizar un nombre ausente, editable o enviado por el cliente como identidad autoritativa. El mensaje visible SHALL conservar la forma `Nombre: mensaje`.

#### Scenario: Envío sin nombre
- **GIVEN** el usuario está autenticado y su perfil contiene un nombre
- **WHEN** abre el chat y publica `hola`
- **THEN** `#nombre` muestra el nombre autenticado como solo lectura y el mensaje publicado muestra ese nombre seguido de `: hola`

