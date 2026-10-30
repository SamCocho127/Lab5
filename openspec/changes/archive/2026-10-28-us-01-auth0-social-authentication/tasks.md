## 1. Configuración segura

- [x] 1.1 Instalar y fijar `express-openid-connect` y `dotenv`, verificando compatibilidad con Node 22, Express 4 y CommonJS
- [x] 1.2 Validar `PORT`, `BASE_URL`, `ISSUER_BASE_URL`, `CLIENT_ID` y `SECRET` sin imprimir valores, con pruebas de configuración completa e incompleta
- [x] 1.3 Mantener `.env` ignorado y crear `.env.example` solo con marcadores seguros

## 2. Autenticación HTTP

- [x] 2.1 Crear el runtime Auth0 de producción y una fábrica de servidor que exija autenticación explícita
- [x] 2.2 Implementar página pública, login Google, callback, ruta protegida, API de identidad y logout
- [x] 2.3 Normalizar y escapar nombre, correo e imagen de perfil, y manejar cancelación/errores con mensajes genéricos y reintento
- [x] 2.4 Cubrir configuración, rutas, identidad, logout y errores con pruebas sin contactar Auth0

## 3. Socket.IO e identidad autoritativa

- [x] 3.1 Aplicar la sesión al handshake y rechazar sockets no autenticados
- [x] 3.2 Sustituir siempre `msg.nombre` por la identidad del servidor y validar datos visibles antes de emitir
- [x] 3.3 Desconectar sockets anteriores en logout y cubrir reconexión y dos identidades concurrentes
- [x] 3.4 Conservar texto, imágenes, YouTube, archivos de video y bloqueo de scripts en pruebas de integración

## 4. Interfaz y extremo a extremo

- [x] 4.1 Añadir la pantalla previa al login y mostrar la identidad autenticada en `#nombre` de solo lectura sin romper selectores existentes
- [x] 4.2 Adaptar el cliente a rutas protegidas, errores de socket y logout, conservando `Send`, `#m`, `#messages` y `Evento-Mensaje-Server`
- [x] 4.3 Crear un servidor fixture de pruebas aislado y cubrir interfaz antes/después del login, medios, texto, script y logout con Playwright

## 5. Documentación y seguridad automatizada

- [x] 5.1 Reemplazar README con instalación, Auth0/Google, URLs locales, variables, ejecución, pruebas, diagnóstico, secretos y alcance local
- [x] 5.2 Ejecutar Mocha, Jest, Playwright, `test:all`, `npm audit` y Snyk cuando esté autenticado, corrigiendo hallazgos atribuibles al cambio
- [x] 5.3 Validar OpenSpec, revisar el diff y confirmar que `.env`, tokens, cookies y credenciales no están rastreados

## 6. Validación real y cierre

- [x] 6.1 Confirmar manualmente con Google login, callback, identidad, texto, imagen, video, logout, cancelación, reintento y dos sesiones
- [x] 6.2 Actualizar la memoria persistente con decisiones, pruebas, archivos, alcance local y pendientes sin secretos
- [x] 6.3 Sincronizar las specs y archivar el cambio únicamente después de completar todas las verificaciones automáticas y manuales
