var path = require('path');
var express = require('express');
var http = require('http');
var socketIo = require('socket.io');
var validation = require('./libs/unalib');
var { AuthConfigurationError, createAuthRuntime } = require('./libs/auth');

var EVENTO_MENSAJE = 'Evento-Mensaje-Server';

function createChatServer(options) {
  if (!options || !options.authRuntime || typeof options.authRuntime.middleware !== 'function') {
    throw new Error('Se requiere un runtime de autenticación explícito');
  }

  var authRuntime = options.authRuntime;
  var app = express();
  var server = http.createServer(app);
  var io = socketIo(server);
  var socketsBySubject = new Map();

  function authenticated(req) {
    return authRuntime.isAuthenticated(req) && Boolean(authRuntime.identity(req));
  }

  function requirePageAuthentication(req, res, next) {
    if (authenticated(req)) {
      return next();
    }
    return res.redirect('/?login_required=1');
  }

  function requireApiAuthentication(req, res, next) {
    if (authenticated(req)) {
      return next();
    }
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  function rememberSocket(socket) {
    var subject = socket.data.identity.sub;
    if (!socketsBySubject.has(subject)) {
      socketsBySubject.set(subject, new Set());
    }
    socketsBySubject.get(subject).add(socket);
  }

  function forgetSocket(socket) {
    var identity = socket.data.identity;
    if (!identity || !socketsBySubject.has(identity.sub)) {
      return;
    }
    var sockets = socketsBySubject.get(identity.sub);
    sockets.delete(socket);
    if (sockets.size === 0) {
      socketsBySubject.delete(identity.sub);
    }
  }

  function disconnectSubject(subject) {
    var sockets = socketsBySubject.get(subject);
    if (!sockets) {
      return;
    }
    Array.from(sockets).forEach(function (socket) {
      socket.data.identity = null;
      socket.disconnect(true);
    });
    socketsBySubject.delete(subject);
  }

  app.use(authRuntime.middleware);

  app.get('/', function (req, res) {
    if (authenticated(req)) {
      return res.redirect('/chat');
    }
    return res.sendFile(path.join(__dirname, 'login.html'));
  });

  app.get('/login', function (req, res, next) {
    Promise.resolve(authRuntime.login(req, res)).catch(next);
  });

  app.get('/chat', requirePageAuthentication, function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  app.get('/api/me', requireApiAuthentication, function (req, res) {
    res.json(authRuntime.identity(req));
  });

  app.get('/logout', function (req, res, next) {
    var identity = authRuntime.identity(req);
    if (!authenticated(req) || !identity) {
      return res.redirect('/');
    }
    disconnectSubject(identity.sub);
    return Promise.resolve(authRuntime.logout(req, res)).catch(next);
  });

  function prepareEngineRequestForExpress(req, res) {
    Object.setPrototypeOf(req, app.request);
    req.res = res;
    res.req = req;
    res.get = app.response.get;
    res.set = app.response.set;
    res.header = app.response.header;
    res.append = app.response.append;
    res.cookie = app.response.cookie;
    res.clearCookie = app.response.clearCookie;
  }

  io.engine.use(function (req, res, next) {
    var isHandshake = !req._query || req._query.sid === undefined;
    if (!isHandshake) {
      return next();
    }
    prepareEngineRequestForExpress(req, res);
    try {
      return authRuntime.middleware(req, res, next);
    } catch (error) {
      return next(error);
    }
  });

  io.use(function (socket, next) {
    if (!authenticated(socket.request)) {
      return next(new Error('Autenticación requerida'));
    }
    socket.data.identity = authRuntime.identity(socket.request);
    return next();
  });

  io.on('connection', function (socket) {
    rememberSocket(socket);

    socket.on(EVENTO_MENSAJE, function (msg) {
      if (!socket.data.identity) {
        socket.disconnect(true);
        return;
      }
      var validated = validation.validateMessage(msg, socket.data.identity);
      io.emit(EVENTO_MENSAJE, validated);
    });

    socket.on('disconnect', function () {
      forgetSocket(socket);
    });
  });

  app.use(function (err, req, res, next) {
    if (res.headersSent) {
      return next(err);
    }
    console.error('Error de autenticación controlado');
    return res.redirect('/?auth_error=1');
  });

  return {
    app: app,
    server: server,
    io: io,
    disconnectSubject: disconnectSubject
  };
}

function startProductionServer(environment) {
  var env = environment || process.env;
  var authRuntime = createAuthRuntime(env);
  var chat = createChatServer({ authRuntime: authRuntime });
  chat.server.listen(authRuntime.config.port, function () {
    console.log('UNA Chat disponible en ' + authRuntime.config.baseURL);
  });
  return chat;
}

if (require.main === module) {
  require('dotenv').config({ quiet: true });
  try {
    startProductionServer(process.env);
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      console.error(error.message);
    } else {
      console.error('No se pudo iniciar UNA Chat');
    }
    process.exitCode = 1;
  }
}

module.exports = {
  EVENTO_MENSAJE: EVENTO_MENSAJE,
  createChatServer: createChatServer,
  startProductionServer: startProductionServer
};
