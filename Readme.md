## express-mock-restful

[![Build Status](https://travis-ci.org/xuxihai123/express-mock-restful.svg?branch=master)](https://travis-ci.org/xuxihai123/express-mock-restful)

express-mock is a express middleware that creates mocks for REST APIs. It will be helpful when you try to test your application without the actual REST API server.

**Features:**

🔥 Built in support for hot Mocker file replacement.  
🚀 Quickly and easily configure the API via JSON.

## Installation

```bash
npm install express-mock-restful --save-dev
```

## Usage

express-mock-restful dev support mock, configured in `mocker.js`. refresh mock with require('express-mock-restful').refresh api

```js
const mockMap = {
  'GET /api/user': {
    id: 1,
    username: 'kenny',
    sex: 6,
  },
  'GET /api/user/list': [
    {
      id: 1,
      username: 'kenny',
      sex: 6,
    },
    {
      id: 2,
      username: 'kenny',
      sex: 6,
    },
  ],
  'POST /api/login/account': (req, res) => {
    const { password, username } = req.body;
    if (password === '888888' && username === 'admin') {
      return res.json({
        status: 'ok',
        code: 0,
        token: 'sdfsdfsdfdsf',
        data: {
          id: 1,
          username: 'kenny',
          sex: 6,
        },
      });
    } else {
      return res.json({
        status: 'error',
        code: 403,
      });
    }
  },
  'DELETE /api/user/:id': (req, res) => {
    console.log('---->', req.body);
    console.log('---->', req.params.id);
    res.send({ status: 'ok', message: '删除成功！' });
  },
};
module.exports = mockMap;
```

## simple usage

```diff
const express = require('express');
const path = require('path');
const chokidar = require('chokidar');
const app = express();
+ const apiMocker = require('express-mock-restful');

+ const mockFile = path.resolve(__dirname, './mocker.js');
+ app.use(apiMocker(require(mockFile)));
// or app.use(apiMocker({ entry: './mocker.js' }));

app.listen(3000);
console.log('server listen on http://127.0.0.1:3000/');
```

## Using with refresh mock setting

```diff
const express = require('express');
const path = require('path');
const chokidar = require('chokidar');
const app = express();
+ const apiMocker = require('express-mock-restful');

+ const mockFile = path.resolve(__dirname, './mocker.js');
+ app.use(apiMocker(require(mockFile)));

// watch file change refresh mock setting
+ chokidar.watch(mockFile).on('all', (event, path) => {
+   try {
+      delete require.cache[require.resolve(mockFile)];
+      apiMocker.refresh(require(mockFile));
+      console.log('refresh...');
+  } catch (err) {
+    console.log(err);
+  }
+ });

app.listen(3000);
console.log('server listen on http://127.0.0.1:3000/');
```

## Using with [Webpack](https://github.com/webpack/webpack)

To use api mocker on your [Webpack](https://github.com/webpack/webpack) projects, simply add a setup options to your [webpack-dev-server](https://github.com/webpack/webpack-dev-server) options:

Change your config file to tell the dev server where to look for files: `webpack.config.js`.

```diff
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
+ const apiMocker = require('express-mock-restful');

module.exports = {
  mocker: {
    app: './src/index.js',
    print: './src/print.js'
  },
  devtool: 'inline-source-map',
+ devServer: {
+   ...
+   before(app){
+     app.use(apiMocker(require('./mocker/index.js'));
+   }
+ },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Development'
    })
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
```

Must have a file suffix! For example: `./mocker.js`.

Let's add a script to easily run the dev server as well: `package.json`

```diff
  {
    "name": "development",
    "version": "1.0.0",
    "description": "",
    "main": "webpack.config.js",
    "scripts": {
      "test": "echo \"Error: no test specified\" && exit 1",
+     "start": "webpack-dev-server --open",
      "build": "webpack"
    },
    "keywords": [],
    "author": "",
    "license": "MIT",
    "devDependencies": {
      ....
    }
  }
```
