var http = require('http');
var { io: conectar } = require('socket.io-client');
var { createChatServer, EVENTO_MENSAJE } = require('../server');
var { cookieFor, createFakeAuthRuntime } = require('../test/helpers/fake-auth');

function urlDelChat(port, pathname) {
  return 'http://127.0.0.1:' + port + (pathname || '');
}

function solicitar(port, pathname, cookie) {
  return new Promise(function (resolve, reject) {
    var request = http.get(urlDelChat(port, pathname), {
      headers: cookie ? { Cookie: cookie } : {}
    }, function (response) {
      var body = '';
      response.on('data', function (chunk) { body += chunk; });
      response.on('end', function () {
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: body
        });
      });
    });
    request.on('error', reject);
  });
}

function abrirCliente(port, cookie) {
  return conectar(urlDelChat(port), {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    extraHeaders: cookie ? { Cookie: cookie } : {}
  });
}

function conectarCliente(cliente) {
  return new Promise(function (resolve, reject) {
    cliente.once('connect', resolve);
    cliente.once('connect_error', reject);
  });
}

function publicar(cliente, texto, nombre) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () {
      reject(new Error('el chat no publicó el mensaje'));
    }, 5000);

    cliente.once(EVENTO_MENSAJE, function (msg) {
      clearTimeout(timer);
      resolve(JSON.parse(msg));
    });

    cliente.emit(EVENTO_MENSAJE, JSON.stringify({
      nombre: nombre || 'nombre falso',
      mensaje: texto,
      color: '#112233'
    }));
  });
}

describe('integracion autenticada del chat', function () {
  var chat;
  var port;
  var clientes = [];

  beforeAll(function (done) {
    chat = createChatServer({ authRuntime: createFakeAuthRuntime() });
    chat.server.listen(0, function () {
      port = chat.server.address().port;
      done();
    });
  });

  afterEach(function () {
    clientes.forEach(function (cliente) { cliente.close(); });
    clientes = [];
  });

  afterAll(function (done) {
    chat.io.close(done);
  });

  function nuevoCliente(profile) {
    var cliente = abrirCliente(port, profile ? cookieFor(profile) : '');
    clientes.push(cliente);
    return cliente;
  }

  test('la raiz publica muestra el acceso con Google y no el chat', async function () {
    var response = await solicitar(port, '/');
    expect(response.status).toBe(200);
    expect(response.body).toContain('Continuar con Google');
    expect(response.body).not.toContain('id="messages"');
  });

  test('el acceso directo al chat sin sesion vuelve a la pagina publica', async function () {
    var response = await solicitar(port, '/chat');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/?login_required=1');
  });

  test('el login simulado establece sesion y conduce al chat', async function () {
    var response = await solicitar(port, '/login');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/chat');
    expect(response.headers['set-cookie'][0]).toContain('test_auth=ana');
  });

  test('un error del proveedor se convierte en mensaje recuperable', async function () {
    var spy = jest.spyOn(console, 'error').mockImplementation(function () {});
    var response = await solicitar(port, '/callback?error=access_denied&error_description=secreto');
    spy.mockRestore();

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/?auth_error=1');
    expect(response.headers.location).not.toContain('secreto');
  });

  test('la pagina y la API protegidas muestran la identidad autenticada', async function () {
    var page = await solicitar(port, '/chat', cookieFor('ana'));
    var profile = await solicitar(port, '/api/me', cookieFor('ana'));

    expect(page.status).toBe(200);
    expect(page.body).toContain('id="nombre"');
    expect(page.body).toContain('readonly');
    expect(page.body).toContain('.html(mensajeDisplay)');
    expect(JSON.parse(profile.body).name).toBe('Ana Segura');
  });

  test('un socket sin sesion es rechazado', function (done) {
    var cliente = nuevoCliente();
    cliente.once('connect', function () {
      done(new Error('el socket no autenticado fue aceptado'));
    });
    cliente.once('connect_error', function (error) {
      expect(error.message).toBe('Autenticación requerida');
      done();
    });
  });

  test('el handshake permite leer y renovar la cookie con metodos Express', async function () {
    var cliente = nuevoCliente('ana');
    await conectarCliente(cliente);

    expect(cliente.connected).toBe(true);
  });

  test('el servidor sustituye un nombre falsificado', async function () {
    var cliente = nuevoCliente('ana');
    await conectarCliente(cliente);
    var salida = await publicar(cliente, 'hola', 'Administrador falso');

    expect(salida.nombre).toBe('Ana Segura');
    expect(salida.nombre).not.toContain('Administrador falso');
  });

  test('una URL de imagen se publica como imagen autenticada', async function () {
    var cliente = nuevoCliente('ana');
    await conectarCliente(cliente);
    var salida = await publicar(cliente, 'http://image.com/image.jpg');

    expect(salida.nombre).toBe('Ana Segura');
    expect(salida.mensaje).toContain('<img');
    expect(salida.mensaje).toContain('src="http://image.com/image.jpg"');
  });

  test('YouTube se publica como reproductor autenticado', async function () {
    var cliente = nuevoCliente('ana');
    await conectarCliente(cliente);
    var salida = await publicar(cliente, 'https://www.youtube.com/watch?v=qYwlqx-JLok');

    expect(salida.mensaje).toContain('<iframe');
    expect(salida.mensaje).toContain('https://www.youtube.com/embed/qYwlqx-JLok');
  });

  test('un archivo de video se publica con controles', async function () {
    var cliente = nuevoCliente('ana');
    await conectarCliente(cliente);
    var salida = await publicar(cliente, 'https://cdn.example.com/clip.mp4');

    expect(salida.mensaje).toContain('<video');
    expect(salida.mensaje).toContain('controls');
  });

  test('el texto plano se publica y el HTML ordinario se escapa', async function () {
    var cliente = nuevoCliente('ana');
    await conectarCliente(cliente);
    var texto = await publicar(cliente, 'hola equipo');
    var html = await publicar(cliente, '<b>hola</b>');

    expect(texto.mensaje).toBe('hola equipo');
    expect(html.mensaje).toBe('&lt;b&gt;hola&lt;/b&gt;');
  });

  test('una URL dentro de una frase sigue siendo texto', async function () {
    var cliente = nuevoCliente('ana');
    await conectarCliente(cliente);
    var salida = await publicar(cliente, 'mira http://image.com/image.jpg');

    expect(salida.mensaje).toBe('mira http://image.com/image.jpg');
  });

  test('una inyeccion de script llega vacia', async function () {
    var cliente = nuevoCliente('ana');
    await conectarCliente(cliente);
    var salida = await publicar(cliente, '<script>alert("xss")</script>');

    expect(salida.mensaje).toBe('');
  });

  test('una sesion valida puede reconectar con la misma identidad', async function () {
    var primero = nuevoCliente('ana');
    await conectarCliente(primero);
    primero.close();

    var segundo = nuevoCliente('ana');
    await conectarCliente(segundo);
    var salida = await publicar(segundo, 'reconectado');
    expect(salida.nombre).toBe('Ana Segura');
  });

  test('dos usuarios reciben mensajes con identidades distintas', async function () {
    var ana = nuevoCliente('ana');
    var bob = nuevoCliente('bob');
    await Promise.all([conectarCliente(ana), conectarCliente(bob)]);

    var recibidoPorBob = new Promise(function (resolve) {
      bob.once(EVENTO_MENSAJE, function (msg) { resolve(JSON.parse(msg)); });
    });
    ana.emit(EVENTO_MENSAJE, JSON.stringify({ nombre: 'Bob Seguro', mensaje: 'de Ana', color: '#112233' }));
    var mensajeAna = await recibidoPorBob;
    expect(mensajeAna.nombre).toBe('Ana Segura');

    var recibidoPorAna = new Promise(function (resolve) {
      ana.once(EVENTO_MENSAJE, function (msg) { resolve(JSON.parse(msg)); });
    });
    bob.emit(EVENTO_MENSAJE, JSON.stringify({ nombre: 'Ana Segura', mensaje: 'de Bob', color: '#112233' }));
    var mensajeBob = await recibidoPorAna;
    expect(mensajeBob.nombre).toBe('Bob Seguro');
  });

  test('logout desconecta el socket anterior y limpia la cookie', async function () {
    var cliente = nuevoCliente('ana');
    await conectarCliente(cliente);
    var disconnected = new Promise(function (resolve) {
      cliente.once('disconnect', resolve);
    });

    var response = await solicitar(port, '/logout', cookieFor('ana'));
    await disconnected;

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
    expect(response.headers['set-cookie'][0]).toContain('Max-Age=0');
    expect(cliente.connected).toBe(false);
  });
});
