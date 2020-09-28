const express = require('express');
const path = require('path');
const chokidar = require('chokidar');
const app = express();
const mockMiddleware = require('../../lib');

// app.get('/', function (req, res) {
//   res.send('test with curl example: curl -vs http://127.0.0.1:3000/api/user ');
// });

const mockFile = path.resolve(__dirname, './entry.js');

const logFn = function(type, msg) {
  console.log(type, msg);
};
app.use(mockMiddleware(require(mockFile), logFn));

chokidar.watch(mockFile).on('all', (event, path) => {
  try {
    delete require.cache[require.resolve(mockFile)];
    mockMiddleware.refresh(require(mockFile));
    console.log('refresh...');
  } catch (err) {
    console.log(err);
  }
});

app.listen(3000);
console.log('server listen on http://127.0.0.1:3000/');
