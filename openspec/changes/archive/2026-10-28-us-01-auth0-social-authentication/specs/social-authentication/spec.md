## Purpose

Protege UNA Chat con una sesión social local de Auth0 y usa la identidad autenticada como única fuente confiable para el acceso HTTP y Socket.IO.

## ADDED Requirements

### Requirement: Acceso local mediante Google y Auth0
UNA Chat SHALL ofrecer en `http://localhost:3000` un inicio de sesión social mediante la conexión Auth0 `google-oauth2`, SHALL completar el callback local configurado y SHALL volver al chat con una sesión válida.

#### Scenario: Usuario inicia login
- **GIVEN** un visitante está en la página pública previa al chat
- **WHEN** activa la opción de iniciar sesión
- **THEN** la aplicación inicia el flujo de autorización de Auth0

#### Scenario: Usuario selecciona Google
- **GIVEN** el flujo de autorización fue iniciado
- **WHEN** Auth0 procesa la solicitud
- **THEN** se utiliza la conexión social `google-oauth2`

#### Scenario: Usuario completa el login
- **GIVEN** el usuario aprueba el acceso con Google
- **WHEN** Auth0 devuelve el navegador a `/callback`
- **THEN** la aplicación establece una sesión local y redirige al chat

#### Scenario: Usuario regresa autenticado
- **GIVEN** existe una sesión válida
- **WHEN** el usuario abre la aplicación o el chat
- **THEN** puede acceder al chat sin repetir el login durante la vigencia de la sesión

### Requirement: Chat protegido para visitantes
La aplicación SHALL mantener una página pública de acceso, SHALL exigir una sesión válida para la página del chat y su API de identidad, y SHALL impedir que una navegación directa omita el control.

#### Scenario: Visitante abre el chat sin sesión
- **GIVEN** no existe una sesión válida
- **WHEN** el visitante abre la raíz de UNA Chat
- **THEN** ve una página previa con una opción comprensible para continuar con Google y no ve el chat

#### Scenario: Visitante intenta acceder directamente
- **GIVEN** no existe una sesión válida
- **WHEN** el visitante solicita directamente la ruta protegida del chat
- **THEN** la aplicación rechaza el acceso y lo conduce al inicio de autenticación

### Requirement: Identidad autenticada visible y confiable
UNA Chat SHALL mostrar una identidad derivada de la sesión Auth0 y SHALL usar esa identidad en cada mensaje, ignorando cualquier nombre suministrado por el navegador o por un cliente Socket.IO.

#### Scenario: Identidad visible
- **GIVEN** un usuario tiene una sesión válida con datos de perfil
- **WHEN** abre el chat
- **THEN** ve su nombre autenticado en el campo `#nombre` de solo lectura y en el área de identidad

#### Scenario: Publicación autenticada
- **GIVEN** un socket pertenece a una sesión válida
- **WHEN** publica un mensaje
- **THEN** el servidor lo difunde con la identidad obtenida de la sesión

#### Scenario: Intento de falsificar el nombre
- **GIVEN** un usuario autenticado altera `#nombre` o envía un JSON con otro `nombre`
- **WHEN** publica el mensaje
- **THEN** el servidor sustituye el nombre falso por la identidad de la sesión

### Requirement: Socket.IO protegido por la sesión
El servidor SHALL autenticar el handshake Socket.IO con la misma sesión HTTP, SHALL rechazar conexiones sin identidad y SHALL impedir eventos de sockets cuya autorización ya no sea válida.

#### Scenario: Socket sin autenticación
- **GIVEN** un cliente no presenta una sesión válida
- **WHEN** intenta abrir un socket
- **THEN** el servidor rechaza el handshake con un error de autenticación sin detalles internos

#### Scenario: Socket autenticado
- **GIVEN** un cliente presenta una sesión válida
- **WHEN** abre un socket
- **THEN** el servidor acepta la conexión y asocia la identidad autenticada

#### Scenario: Reconexión
- **GIVEN** un usuario autenticado pierde y recupera la conexión de red mientras su sesión sigue válida
- **WHEN** Socket.IO realiza un nuevo handshake
- **THEN** el servidor vuelve a validar la sesión y permite reconectar con la misma identidad

#### Scenario: Logout y reutilización del socket anterior
- **GIVEN** un usuario tiene un socket autenticado abierto
- **WHEN** cierra sesión e intenta reutilizar ese socket
- **THEN** el servidor desconecta el socket anterior y no acepta publicaciones posteriores

#### Scenario: Dos usuarios autenticados intercambian mensajes
- **GIVEN** dos sesiones válidas con identidades diferentes mantienen sockets abiertos
- **WHEN** cada usuario publica un mensaje
- **THEN** ambos reciben cada mensaje con la identidad correcta de su autor

### Requirement: Logout completo
La aplicación SHALL permitir cerrar la sesión local y de Auth0, SHALL invalidar el acceso protegido de esa sesión y SHALL volver a una página pública que permita iniciar sesión otra vez.

#### Scenario: Logout
- **GIVEN** un usuario está autenticado
- **WHEN** activa la opción de cerrar sesión
- **THEN** pierde acceso al chat, sus sockets se desconectan y vuelve a la página pública

### Requirement: Errores recuperables sin información sensible
La aplicación SHALL presentar un mensaje comprensible ante cancelación o error de autenticación, SHALL permitir reintentar y SHALL fallar de forma controlada cuando falte configuración, sin mostrar secretos ni detalles internos.

#### Scenario: Cancelación del login
- **GIVEN** un visitante inició el flujo social
- **WHEN** cancela o rechaza el acceso en Auth0
- **THEN** vuelve a una página con un mensaje comprensible y una opción de reintento

#### Scenario: Error de Auth0
- **GIVEN** Auth0 devuelve un error durante el flujo
- **WHEN** la aplicación procesa el error
- **THEN** muestra un mensaje genérico, no expone datos internos y ofrece reintentar

#### Scenario: Reintento
- **GIVEN** se mostró un error recuperable de autenticación
- **WHEN** el usuario elige reintentar
- **THEN** comienza un nuevo flujo de login

#### Scenario: Configuración faltante
- **GIVEN** falta una variable obligatoria de autenticación
- **WHEN** el servidor intenta iniciar
- **THEN** termina de forma controlada indicando solo los nombres de las variables ausentes

### Requirement: Configuración y secretos fuera de Git
La aplicación SHALL leer `PORT`, `BASE_URL`, `ISSUER_BASE_URL`, `CLIENT_ID` y `SECRET` desde el entorno, SHALL mantener `.env` fuera de Git y SHALL proporcionar únicamente marcadores seguros en `.env.example`.

#### Scenario: Ausencia de secretos en Git
- **GIVEN** el proyecto contiene documentación, pruebas y ejemplos de configuración
- **WHEN** se revisan los archivos rastreables
- **THEN** no aparecen valores reales de secretos, tokens, cookies ni credenciales

### Requirement: Funcionalidad existente detrás de autenticación
Una sesión autenticada SHALL conservar el comportamiento observable de texto, imágenes, YouTube, archivos de video y bloqueo de scripts.

#### Scenario: Mensaje de texto
- **GIVEN** un usuario autenticado escribe texto plano
- **WHEN** publica el mensaje
- **THEN** el chat muestra su identidad y el texto sin insertar un medio

#### Scenario: Imagen
- **GIVEN** un usuario autenticado publica una URL completa de imagen aceptada
- **WHEN** el servidor procesa el mensaje
- **THEN** el chat muestra la imagen con la identidad autenticada

#### Scenario: Video de YouTube
- **GIVEN** un usuario autenticado publica una URL de YouTube aceptada
- **WHEN** el servidor procesa el mensaje
- **THEN** el chat muestra el reproductor de YouTube con la identidad autenticada

#### Scenario: Archivo de video
- **GIVEN** un usuario autenticado publica una URL completa de archivo de video aceptada
- **WHEN** el servidor procesa el mensaje
- **THEN** el chat muestra un reproductor con controles y la identidad autenticada

#### Scenario: Intento de script
- **GIVEN** un usuario autenticado publica contenido detectado como inyección de script
- **WHEN** el servidor procesa el mensaje
- **THEN** el texto queda vacío y no se inserta el script ni un medio

