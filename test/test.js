var val = require('../libs/unalib');
var assert = require('assert');

function publicar(texto) {
  var entrada = JSON.stringify({
    nombre: 'usuario',
    mensaje: texto,
    color: '#000000'
  });

  return JSON.parse(val.validateMessage(entrada));
}


describe('unalib', function(){


  describe('funcion is_valid_phone', function(){

    it('deberia devolver true para 8297-8547', function(){

      assert.equal(val.is_valid_phone('8297-8547'), true);

    });

    it('deberia devolver false para 8297p-8547', function(){

      assert.equal(val.is_valid_phone('8297p-8547'), false);

    });

  });


  describe('funcion is_valid_url_image', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);

    });

    it('deberia devolver true para http://image.com/image.gif', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.gif'), true);

    });

    it('deberia devolver true para https y extension en mayusculas', function(){

      assert.equal(val.is_valid_url_image('https://cdn.example.com/foto.PNG'), true);

    });

    it('deberia devolver true para jpeg, bmp y webp', function(){

      assert.equal(val.is_valid_url_image('https://cdn.example.com/a.jpeg'), true);
      assert.equal(val.is_valid_url_image('https://cdn.example.com/b.bmp'), true);
      assert.equal(val.is_valid_url_image('https://cdn.example.com/c.webp'), true);

    });

    it('deberia devolver true para una URL con query', function(){

      assert.equal(val.is_valid_url_image('https://cdn.example.com/foto.jpg?size=large'), true);

    });

    it('deberia devolver true si hay espacios alrededor', function(){

      assert.equal(val.is_valid_url_image('  http://image.com/image.jpg  '), true);

    });

    it('deberia devolver false si la URL va dentro de una frase', function(){

      assert.equal(val.is_valid_url_image('mira http://image.com/image.jpg'), false);

    });

    it('deberia devolver false para una pagina', function(){

      assert.equal(val.is_valid_url_image('https://example.com/pagina'), false);

    });
    
  });

  describe('funcion is_valid_yt_video', function(){

    it('deberia devolver true para https://www.youtube.com/watch?v=qYwlqx-JLok', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);

    });

    it('deberia devolver true para youtu.be y embed', function(){

      assert.equal(val.is_valid_yt_video('https://youtu.be/qYwlqx-JLok'), true);
      assert.equal(val.is_valid_yt_video('https://www.youtube.com/embed/qYwlqx-JLok'), true);

    });

    it('deberia devolver true para watch con parametros extra', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok&t=30'), true);

    });

    it('deberia devolver null cuando no hay identificador', function(){

      assert.equal(val.getYTVideoId('https://example.com/pagina'), null);
      assert.equal(val.is_valid_yt_video('https://example.com/pagina'), false);

    });

  });

  describe('funcion is_valid_url_video', function(){

    it('deberia devolver true para mp4, webm, ogg, ogv y mov', function(){

      assert.equal(val.is_valid_url_video('https://cdn.example.com/clip.mp4'), true);
      assert.equal(val.is_valid_url_video('https://cdn.example.com/clip.webm'), true);
      assert.equal(val.is_valid_url_video('https://cdn.example.com/clip.ogg'), true);
      assert.equal(val.is_valid_url_video('https://cdn.example.com/clip.ogv'), true);
      assert.equal(val.is_valid_url_video('http://cdn.example.com/clip.MOV?dl=1'), true);

    });

    it('deberia devolver false para una imagen', function(){

      assert.equal(val.is_valid_url_video('http://image.com/image.jpg'), false);

    });

  });

  describe('funcion validateMessage', function(){

    it('escenario URL jpg muestra una imagen', function(){

      var salida = publicar('http://image.com/image.jpg');

      assert.ok(salida.mensaje.indexOf('<img') !== -1);
      assert.ok(salida.mensaje.indexOf('src="http://image.com/image.jpg"') !== -1);

    });

    it('escenario URL gif muestra una imagen', function(){

      var salida = publicar('http://image.com/image.gif');

      assert.ok(salida.mensaje.indexOf('src="http://image.com/image.gif"') !== -1);

    });

    it('escenario URL png con https muestra una imagen', function(){

      var salida = publicar('https://cdn.example.com/foto.PNG');

      assert.ok(salida.mensaje.indexOf('src="https://cdn.example.com/foto.PNG"') !== -1);

    });

    it('escenario jpeg, bmp y webp muestran una imagen', function(){

      ['https://cdn.example.com/a.jpeg', 'https://cdn.example.com/b.bmp', 'https://cdn.example.com/c.webp'].forEach(function(url){
        var salida = publicar(url);
        assert.ok(salida.mensaje.indexOf('src="' + url + '"') !== -1);
      });

    });

    it('escenario URL de imagen con query conserva el origen', function(){

      var salida = publicar('https://cdn.example.com/foto.jpg?size=large');

      assert.ok(salida.mensaje.indexOf('src="https://cdn.example.com/foto.jpg?size=large"') !== -1);

    });

    it('escenario espacios alrededor usan la URL recortada', function(){

      var salida = publicar('  http://image.com/image.jpg  ');

      assert.ok(salida.mensaje.indexOf('src="http://image.com/image.jpg"') !== -1);

    });

    it('escenario URL watch inserta un reproductor de YouTube', function(){

      var salida = publicar('https://www.youtube.com/watch?v=qYwlqx-JLok');

      assert.ok(salida.mensaje.indexOf('<iframe') !== -1);
      assert.ok(salida.mensaje.indexOf('https://www.youtube.com/embed/qYwlqx-JLok') !== -1);

    });

    it('escenario youtu.be y embed insertan el mismo reproductor', function(){

      ['https://youtu.be/qYwlqx-JLok', 'https://www.youtube.com/embed/qYwlqx-JLok'].forEach(function(url){
        var salida = publicar(url);
        assert.ok(salida.mensaje.indexOf('https://www.youtube.com/embed/qYwlqx-JLok') !== -1);
      });

    });

    it('escenario watch con parametros extra usa solo el identificador', function(){

      var salida = publicar('https://www.youtube.com/watch?v=qYwlqx-JLok&t=30');

      assert.ok(salida.mensaje.indexOf('https://www.youtube.com/embed/qYwlqx-JLok') !== -1);
      assert.equal(salida.mensaje.indexOf('t=30'), -1);

    });

    it('escenario mp4 inserta un reproductor con controles', function(){

      var salida = publicar('https://cdn.example.com/clip.mp4');

      assert.ok(salida.mensaje.indexOf('<video') !== -1);
      assert.ok(salida.mensaje.indexOf('controls') !== -1);
      assert.ok(salida.mensaje.indexOf('src="https://cdn.example.com/clip.mp4"') !== -1);

    });

    it('escenario webm, ogg y ogv insertan un reproductor', function(){

      ['https://cdn.example.com/clip.webm', 'https://cdn.example.com/clip.ogg', 'https://cdn.example.com/clip.ogv'].forEach(function(url){
        var salida = publicar(url);
        assert.ok(salida.mensaje.indexOf('<video') !== -1);
        assert.ok(salida.mensaje.indexOf('src="' + url + '"') !== -1);
      });

    });

    it('escenario mov con query inserta un reproductor', function(){

      var salida = publicar('http://cdn.example.com/clip.MOV?dl=1');

      assert.ok(salida.mensaje.indexOf('src="http://cdn.example.com/clip.MOV?dl=1"') !== -1);
      assert.ok(salida.mensaje.indexOf('controls') !== -1);

    });

    it('escenario texto plano se conserva', function(){

      var salida = publicar('hola equipo');

      assert.equal(salida.mensaje, 'hola equipo');
      assert.equal(/<img|<iframe|<video/i.test(salida.mensaje), false);

    });

    it('escenario URL de una pagina se conserva', function(){

      var salida = publicar('https://example.com/pagina');

      assert.equal(salida.mensaje, 'https://example.com/pagina');

    });

    it('escenario URL de imagen dentro de una frase se conserva', function(){

      var salida = publicar('mira http://image.com/image.jpg');

      assert.equal(salida.mensaje, 'mira http://image.com/image.jpg');

    });

    it('deberia bloquear un mensaje con inyeccion de script', function(){

      var entrada = JSON.stringify({
        nombre: 'usuario',
        mensaje: '<script>alert("xss")</script>',
        color: '#000000'
      });

      var salida = JSON.parse(val.validateMessage(entrada));

      assert.equal(salida.mensaje, '');
      assert.equal(/<\s*script/i.test(salida.mensaje), false);

    });

  });

});
