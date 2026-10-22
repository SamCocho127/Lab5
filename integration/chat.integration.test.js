var http = require('http');
var { io: conectar } = require('socket.io-client');
var { server, io } = require('../server');

var EVENTO = 'Evento-Mensaje-Server';

function urlDelChat(port) {
  return 'http://127.0.0.1:' + port;
}

function abrirCliente(port) {
  return conectar(urlDelChat(port), {
    transports: ['websocket'],
    forceNew: true
  });
}

function publicar(cliente, texto) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () {
      reject(new Error('el chat no publico el mensaje'));
    }, 5000);

    cliente.once(EVENTO, function (msg) {
      clearTimeout(timer);
      resolve(JSON.parse(msg));
    });

    cliente.emit(EVENTO, JSON.stringify({
      nombre: 'usuario',
      mensaje: texto,
      color: '#112233'
    }));
  });
}

describe('integracion del chat por socket', function () {
  var port;
  var cliente;

  beforeAll(function (done) {
    server.listen(0, function () {
      port = server.address().port;
      done();
    });
  });

  beforeEach(function (done) {
    cliente = abrirCliente(port);
    cliente.once('connect', function () {
      done();
    });
    cliente.once('connect_error', done);
  });

  afterEach(function () {
    if (cliente) {
      cliente.close();
    }
  });

  afterAll(function (done) {
    io.close(done);
  });

  test('la pagina deja escribir una URL y pinta el HTML del mensaje', function (done) {
    http.get(urlDelChat(port) + '/', function (res) {
      var body = '';
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('end', function () {
        expect(res.statusCode).toBe(200);
        expect(body).toContain('pegue una URL');
        expect(body).toContain(".html(mensajeDisplay)");
        done();
      });
    }).on('error', done);
  });

  test('una URL de imagen se publica como imagen', function () {
    return publicar(cliente, 'http://image.com/image.jpg').then(function (salida) {
      expect(salida.nombre).toBe('usuario');
      expect(salida.color).toBe('#112233');
      expect(salida.mensaje).toContain('<img');
      expect(salida.mensaje).toContain('src="http://image.com/image.jpg"');
    });
  });

  test('una URL de YouTube se publica como reproductor', function () {
    return publicar(cliente, 'https://www.youtube.com/watch?v=qYwlqx-JLok').then(function (salida) {
      expect(salida.mensaje).toContain('<iframe');
      expect(salida.mensaje).toContain('https://www.youtube.com/embed/qYwlqx-JLok');
    });
  });

  test('una URL mp4 se publica como reproductor con controles', function () {
    return publicar(cliente, 'https://cdn.example.com/clip.mp4').then(function (salida) {
      expect(salida.mensaje).toContain('<video');
      expect(salida.mensaje).toContain('controls');
      expect(salida.mensaje).toContain('src="https://cdn.example.com/clip.mp4"');
    });
  });

  test('el texto plano se publica sin cambios', function () {
    return publicar(cliente, 'hola equipo').then(function (salida) {
      expect(salida.mensaje).toBe('hola equipo');
    });
  });

  test('una URL de imagen dentro de una frase sigue siendo texto', function () {
    return publicar(cliente, 'mira http://image.com/image.jpg').then(function (salida) {
      expect(salida.mensaje).toBe('mira http://image.com/image.jpg');
    });
  });

  test('una inyeccion de script llega vacia', function () {
    return publicar(cliente, '<script>alert("xss")</script>').then(function (salida) {
      expect(salida.mensaje).toBe('');
    });
  });

  test('una URL webp con espacios se publica como imagen recortada', function () {
    return publicar(cliente, '  https://cdn.example.com/foto.WEBP  ').then(function (salida) {
      expect(salida.mensaje).toContain('<img');
      expect(salida.mensaje).toContain('src="https://cdn.example.com/foto.WEBP"');
    });
  });

  test('youtu.be se publica como reproductor y omite parametros extra', function () {
    return publicar(cliente, 'https://youtu.be/qYwlqx-JLok').then(function (salida) {
      expect(salida.mensaje).toContain('https://www.youtube.com/embed/qYwlqx-JLok');
      return publicar(cliente, 'https://www.youtube.com/watch?v=qYwlqx-JLok&t=30');
    }).then(function (salida) {
      expect(salida.mensaje).toContain('https://www.youtube.com/embed/qYwlqx-JLok');
      expect(salida.mensaje.indexOf('t=30')).toBe(-1);
    });
  });

  test('una URL webm se publica como reproductor con controles', function () {
    return publicar(cliente, 'https://cdn.example.com/clip.webm').then(function (salida) {
      expect(salida.mensaje).toContain('<video');
      expect(salida.mensaje).toContain('controls');
      expect(salida.mensaje).toContain('src="https://cdn.example.com/clip.webm"');
    });
  });

  test('una URL de pagina no se convierte en medio', function () {
    return publicar(cliente, 'https://example.com/pagina').then(function (salida) {
      expect(salida.mensaje).toBe('https://example.com/pagina');
    });
  });

  test('otro cliente recibe la misma imagen', function (done) {
    var otro = abrirCliente(port);

    otro.once('connect', function () {
      otro.once(EVENTO, function (msg) {
        var salida = JSON.parse(msg);
        expect(salida.mensaje).toContain('src="http://image.com/image.gif"');
        otro.close();
        done();
      });

      cliente.emit(EVENTO, JSON.stringify({
        nombre: 'usuario',
        mensaje: 'http://image.com/image.gif',
        color: '#112233'
      }));
    });

    otro.once('connect_error', function (err) {
      otro.close();
      done(err);
    });
  });
});
