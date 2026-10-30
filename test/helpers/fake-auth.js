var { normalizeIdentity } = require('../../libs/auth');

var PROFILES = {
  ana: {
    sub: 'google-oauth2|ana',
    name: 'Ana Segura',
    email: 'ana@example.test',
    picture: 'https://example.test/ana.png'
  },
  bob: {
    sub: 'google-oauth2|bob',
    name: 'Bob Seguro',
    email: 'bob@example.test',
    picture: 'https://example.test/bob.png'
  }
};

function readCookie(req) {
  var header = req.get('cookie');
  if (!header) {
    return '';
  }
  var match = header.match(/(?:^|;\s*)test_auth=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function createFakeAuthRuntime() {
  function middleware(req, res, next) {
    var parsed = new URL(req.url, 'http://localhost');
    if (parsed.pathname === '/callback' && parsed.searchParams.has('error')) {
      return next(new Error('detalle externo que no debe mostrarse'));
    }

    var profile = PROFILES[readCookie(req)] || null;
    if (parsed.pathname === '/socket.io/' && profile) {
      res.cookie('test_refresh', '1', { httpOnly: true, sameSite: 'Lax' });
    }
    req.oidc = {
      isAuthenticated: function () {
        return Boolean(profile);
      },
      user: profile
    };
    return next();
  }

  return {
    middleware: middleware,
    isAuthenticated: function (req) {
      return Boolean(req.oidc && req.oidc.isAuthenticated());
    },
    identity: function (req) {
      return normalizeIdentity(req.oidc && req.oidc.user);
    },
    login: function (req, res) {
      res.setHeader('Set-Cookie', 'test_auth=ana; Path=/; HttpOnly; SameSite=Lax');
      res.redirect('/chat');
    },
    logout: function (req, res) {
      res.setHeader('Set-Cookie', 'test_auth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
      res.redirect('/');
    }
  };
}

function cookieFor(profile) {
  return 'test_auth=' + encodeURIComponent(profile);
}

module.exports = {
  PROFILES: PROFILES,
  cookieFor: cookieFor,
  createFakeAuthRuntime: createFakeAuthRuntime
};
