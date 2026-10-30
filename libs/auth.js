var REQUIRED_VARIABLES = ['PORT', 'BASE_URL', 'ISSUER_BASE_URL', 'CLIENT_ID', 'SECRET'];

function AuthConfigurationError(missing, invalid) {
  this.name = 'AuthConfigurationError';
  this.missing = missing || [];
  this.invalid = invalid || [];
  this.message = buildConfigurationMessage(this.missing, this.invalid);
  Error.captureStackTrace(this, AuthConfigurationError);
}

AuthConfigurationError.prototype = Object.create(Error.prototype);
AuthConfigurationError.prototype.constructor = AuthConfigurationError;

function buildConfigurationMessage(missing, invalid) {
  var parts = [];
  if (missing.length) {
    parts.push('Variables ausentes: ' + missing.join(', '));
  }
  if (invalid.length) {
    parts.push('Variables inválidas: ' + invalid.join(', '));
  }
  return 'Configuración de autenticación incompleta. ' + parts.join('. ');
}

function isHttpUrl(value) {
  try {
    var parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function validateAuthEnvironment(environment) {
  var env = environment || {};
  var missing = REQUIRED_VARIABLES.filter(function (key) {
    return typeof env[key] !== 'string' || env[key].trim() === '';
  });
  var invalid = [];

  if (!missing.includes('PORT')) {
    var port = Number(env.PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      invalid.push('PORT');
    }
  }
  if (!missing.includes('BASE_URL') && !isHttpUrl(env.BASE_URL)) {
    invalid.push('BASE_URL');
  }
  if (!missing.includes('ISSUER_BASE_URL') && !isHttpUrl(env.ISSUER_BASE_URL)) {
    invalid.push('ISSUER_BASE_URL');
  }
  if (!missing.includes('SECRET') && env.SECRET.length < 32) {
    invalid.push('SECRET');
  }

  if (missing.length || invalid.length) {
    throw new AuthConfigurationError(missing, invalid);
  }

  return {
    port: Number(env.PORT),
    baseURL: env.BASE_URL.trim().replace(/\/$/, ''),
    issuerBaseURL: env.ISSUER_BASE_URL.trim().replace(/\/$/, ''),
    clientID: env.CLIENT_ID.trim(),
    secret: env.SECRET
  };
}

function safeText(value, maximumLength) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maximumLength);
}

function safePicture(value) {
  if (typeof value !== 'string' || value.length > 2048) {
    return '';
  }
  try {
    var parsed = new URL(value);
    return parsed.protocol === 'https:' ? parsed.href : '';
  } catch (error) {
    return '';
  }
}

function normalizeIdentity(user) {
  if (!user || typeof user.sub !== 'string' || user.sub.trim() === '') {
    return null;
  }

  var email = safeText(user.email, 254);
  var name = safeText(user.name, 80) || safeText(user.nickname, 80) || email || 'Usuario autenticado';

  return {
    sub: safeText(user.sub, 255),
    name: name,
    email: email,
    picture: safePicture(user.picture)
  };
}

function createAuthRuntime(environment, authFactory) {
  var config = validateAuthEnvironment(environment);
  var buildMiddleware = authFactory || require('express-openid-connect').auth;
  var middleware = buildMiddleware({
    authRequired: false,
    idpLogout: true,
    secret: config.secret,
    baseURL: config.baseURL,
    clientID: config.clientID,
    issuerBaseURL: config.issuerBaseURL,
    routes: {
      login: false,
      logout: false,
      callback: '/callback',
      postLogoutRedirect: config.baseURL
    },
    session: {
      cookie: {
        httpOnly: true,
        sameSite: 'Lax',
        secure: config.baseURL.indexOf('https://') === 0
      }
    }
  });

  return {
    config: config,
    middleware: middleware,
    isAuthenticated: function (req) {
      return Boolean(req.oidc && req.oidc.isAuthenticated());
    },
    identity: function (req) {
      return normalizeIdentity(req.oidc && req.oidc.user);
    },
    login: function (req, res) {
      return res.oidc.login({
        returnTo: '/chat',
        authorizationParams: {
          connection: 'google-oauth2',
          scope: 'openid profile email'
        }
      });
    },
    logout: function (req, res) {
      return res.oidc.logout({ returnTo: config.baseURL });
    }
  };
}

module.exports = {
  AuthConfigurationError: AuthConfigurationError,
  REQUIRED_VARIABLES: REQUIRED_VARIABLES,
  createAuthRuntime: createAuthRuntime,
  normalizeIdentity: normalizeIdentity,
  validateAuthEnvironment: validateAuthEnvironment
};
