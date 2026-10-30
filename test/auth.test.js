var assert = require('assert');
var {
  AuthConfigurationError,
  createAuthRuntime,
  normalizeIdentity,
  validateAuthEnvironment
} = require('../libs/auth');
var { createChatServer } = require('../server');

function validEnvironment() {
  return {
    PORT: '3000',
    BASE_URL: 'http://localhost:3000',
    ISSUER_BASE_URL: 'https://tenant.example.test',
    CLIENT_ID: 'client-placeholder',
    SECRET: '0123456789abcdef0123456789abcdef'
  };
}

describe('configuracion de autenticacion', function () {
  it('acepta las cinco variables requeridas sin exponer sus valores', function () {
    var config = validateAuthEnvironment(validEnvironment());
    assert.equal(config.port, 3000);
    assert.equal(config.baseURL, 'http://localhost:3000');
  });

  it('informa solo el nombre de una variable ausente', function () {
    var env = validEnvironment();
    delete env.CLIENT_ID;

    assert.throws(function () {
      validateAuthEnvironment(env);
    }, function (error) {
      return error instanceof AuthConfigurationError &&
        error.missing.includes('CLIENT_ID') &&
        error.message.indexOf(env.SECRET) === -1;
    });
  });

  it('rechaza puerto, URL y secreto invalidos de forma controlada', function () {
    var env = validEnvironment();
    env.PORT = '70000';
    env.BASE_URL = 'no-es-url';
    env.SECRET = 'corto';

    assert.throws(function () {
      validateAuthEnvironment(env);
    }, function (error) {
      return error.invalid.includes('PORT') &&
        error.invalid.includes('BASE_URL') &&
        error.invalid.includes('SECRET');
    });
  });

  it('configura el SDK oficial para rutas personalizadas y cookie local', function () {
    var captured;
    var runtime = createAuthRuntime(validEnvironment(), function (config) {
      captured = config;
      return function (req, res, next) { next(); };
    });

    assert.equal(typeof runtime.middleware, 'function');
    assert.equal(captured.authRequired, false);
    assert.equal(captured.routes.login, false);
    assert.equal(captured.routes.logout, false);
    assert.equal(captured.routes.callback, '/callback');
    assert.equal(captured.session.cookie.httpOnly, true);
    assert.equal(captured.session.cookie.sameSite, 'Lax');
    assert.equal(captured.session.cookie.secure, false);
  });

  it('normaliza el perfil y rechaza una imagen no segura', function () {
    var identity = normalizeIdentity({
      sub: 'google|123',
      name: '  Ana\u0000  ',
      email: 'ana@example.test',
      picture: 'http://example.test/ana.png'
    });

    assert.equal(identity.name, 'Ana');
    assert.equal(identity.picture, '');
  });

  it('no permite construir el servidor sin runtime explicito', function () {
    assert.throws(function () {
      createChatServer();
    }, /runtime de autenticación explícito/);
  });
});
