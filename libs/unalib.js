// modulo de ejemplo.

var IMAGE_EXTENSIONS = 'jpeg|jpg|png|gif|bmp|webp';
var VIDEO_EXTENSIONS = 'webm|mp4|ogv|ogg|mov';
var YT_VIDEO = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?(?:[^\s#]*&)?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:[?&#][^\s<>"']*)?$/i;

function mediaUrlPattern(extensions) {
  return new RegExp(
    '^https?:\\/\\/[^\\s<>"\']+\\.(?:' + extensions + ')(?:\\?[^\\s<>"\']*)?(?:#[^\\s<>"\']*)?$',
    'i'
  );
}

function isHttpMediaUrl(url, extensions) {
  if (typeof url !== 'string') {
    return false;
  }
  return mediaUrlPattern(extensions).test(url.trim());
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = {


    // logica que valida si un telefono esta correcto...
    is_valid_phone: function (phone) {
      // inicializacion lazy
      var isValid = false;
      // expresion regular copiada de StackOverflow
      var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;
  
      // validacion Regex
      try {
        isValid = re.test(phone);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
      // fin del try-catch block
    },
  
    is_valid_url_image: function (url) {
      var isValid = false;

      try {
        isValid = isHttpMediaUrl(url, IMAGE_EXTENSIONS);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
    },
  
    is_valid_yt_video: function (url) {
      var isValid = false;

      try {
        isValid = this.getYTVideoId(url) !== null;
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
    },

    is_valid_url_video: function (url) {
      var isValid = false;

      try {
        isValid = isHttpMediaUrl(url, VIDEO_EXTENSIONS);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
    },
  
    getYTVideoId: function(url){
      if (typeof url !== 'string') {
        return null;
      }

      var match = url.trim().match(YT_VIDEO);
      return match ? match[1] : null;
    },
  
    getEmbeddedCode: function (url){
      var id = this.getYTVideoId(url);
      if (!id) {
        return '';
      }
      var code = '<iframe width="560" height="315" src="https://www.youtube.com/embed/'+id+ '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      return code;
    },
  
    getImageTag: function(url){
      var tag = '<img src="'+escapeAttr(String(url).trim())+'" style="max-height: 400px;max-width: 400px;">';
      return tag;
    },

    getVideoTag: function(url){
      var tag = '<video controls src="'+escapeAttr(String(url).trim())+'" style="max-height: 400px;max-width: 400px;"></video>';
      return tag;
    },

    is_script_injection: function (text) {
      var isInjection = false;
      var re = /<\s*\/?\s*script\b|javascript\s*:|on\w+\s*=/i;

      try {
        if (typeof text === 'string') {
          isInjection = re.test(text);
        }
      } catch (e) {
        console.log(e);
        isInjection = true;
      } finally {
        return isInjection;
      }
    },
  
    validateMessage: function(msg){
      // Handle invalid input
      if (!msg || typeof msg !== 'string') {
        return JSON.stringify({ mensaje: '' });
      }

      try {
        var obj = JSON.parse(msg);

      if (this.is_script_injection(obj.mensaje)) {
        console.log("Inyeccion de script bloqueada");
        obj.mensaje = '';
      }
      else if(this.is_valid_url_image(obj.mensaje)){
        console.log("Es una imagen!")
        obj.mensaje = this.getImageTag(obj.mensaje);
      }
      else if(this.is_valid_yt_video(obj.mensaje)){
        console.log("Es un video!")
        obj.mensaje = this.getEmbeddedCode(obj.mensaje);
      }
      else if(this.is_valid_url_video(obj.mensaje)){
        console.log("Es un archivo de video!")
        obj.mensaje = this.getVideoTag(obj.mensaje);
      }
      else{
        console.log("Es un texto!")
      }
      
      return JSON.stringify(obj);
      } catch (e) {
        console.log('Error processing message:', e);
        return JSON.stringify({ mensaje: msg }); // Return original message on error
      }
    }
  
  
  
    
    
  
  // fin del modulo
  };
