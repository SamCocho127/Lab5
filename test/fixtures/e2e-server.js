var { createChatServer } = require('../../server');
var { createFakeAuthRuntime } = require('../helpers/fake-auth');

var port = Number(process.env.PORT || 3010);
var chat = createChatServer({ authRuntime: createFakeAuthRuntime() });

chat.server.listen(port, '127.0.0.1', function () {
  console.log('Servidor e2e listo');
});
