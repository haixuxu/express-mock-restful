const express = require('express');

const app = express();
const mockMiddleware = require('../../lib');

app.get('/', function (req, res) {
  res.send('test with curl example: curl -vs http://127.0.0.1:3000/api/user');
});
app.use(mockMiddleware(require('./entry')));

app.listen(3000);

console.log('server listen on http://127.0.0.1:3000/');
