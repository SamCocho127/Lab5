## Context

Ver `proposal.md` para el motivo. La pantalla vive en `index.html`: un formulario fijo abajo, una lista `#messages` y el HTML del mensaje armado en el cliente. Las pruebas de integración buscan en esa página el texto `pegue una URL` y la llamada `.html(mensajeDisplay)`. Las pruebas de extremo a extremo usan `#nombre`, `#m`, el botón `Send` y el texto `Ana: hola equipo`. La clasificación de URLs sigue en el servidor y no forma parte de este cambio. Los requisitos de presentación están en `specs/chat-experience/spec.md`.

## Goals / Non-Goals

**Goals:**

- Reorganizar la página para que el encabezado, la lista y el formulario se distingan, sin tapar el último mensaje.
- Impedir el envío cuando el texto, ya recortado, está vacío.
- Hacer que imagen, iframe y video quepan en la lista.
- Dejar pasar las suites unitaria, de integración y de extremo a extremo que ya existen.

**Non-Goals:**

- Cambiar la clasificación de URLs, el evento de socket o el HTML con el que el servidor describe una imagen o un video.
- Rediseñar el protocolo del mensaje (`nombre`, `mensaje`, `color`).
- Agregar cuentas, historial o timestamps.

## Decisions

### Todo el cambio queda en la página

El encabezado, los estilos, el aviso y el rechazo del mensaje vacío viven en `index.html`. El servidor no necesita saber si el texto estaba vacío: el cliente no lo emite.

Alternativa considerada: rechazar el vacío en `validateMessage`. Se descarta porque el campo solo debe conservar el texto si el envío ni siquiera sale del navegador, y las pruebas del servidor seguirían recibiendo cualquier cadena que otro cliente emita.

### El texto publicado no cambia de forma

El nombre y el mensaje se siguen insertando como `<b>` con el color, dos puntos y el mensaje, mediante `.html(mensajeDisplay)`. El botón sigue diciendo `Send`. El placeholder del mensaje sigue conteniendo `pegue una URL`. El aviso nuevo va fuera de `#messages`.

Alternativa considerada: dibujar burbujas con otro marcado. Se descarta porque las pruebas leen `Ana: hola equipo` dentro del elemento de la lista.

### Vacío significa recorte vacío

Antes de emitir se usa el texto sin espacios de los extremos. Si queda vacío, no hay emisión y el campo no se limpia. Un mensaje con texto real se envía tal como está, sin recortarlo, y después el campo se limpia.

### El nombre vacío se muestra como Anónimo

Esa sustitución ocurre en el cliente, en el mismo sitio donde hoy se usa un nombre de respaldo. No se corrige en el servidor.

### Los medios se limitan con CSS de la lista

`#messages img`, `#messages video` y `#messages iframe` usan `max-width: 100%`. El iframe conserva proporción para no quedar en altura cero. No se modifica el `src` ni el atributo `controls`.

## Risks / Trade-offs

- [El marcado nuevo rompe el texto que leen las pruebas] → Se conserva la cadena de presentación y los identificadores `#nombre`, `#m` y `#messages`.
- [Un cliente distinto todavía puede emitir un mensaje vacío] → Esta mejora cubre el formulario de la página. El servidor sigue aceptando el texto que reciba.
- [Un iframe al 100% del ancho se ve más bajo] → Sigue siendo el mismo reproductor; solo cambia el tamaño visible.

## Migration Plan

Al recargar la página se usa la presentación nueva. Para volver atrás basta restaurar `index.html` y el escenario nuevo de `e2e/chat.spec.js`. No hay datos guardados.
