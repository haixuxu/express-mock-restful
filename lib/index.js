const bodyParser = require('body-parser');
const path = require('path');
const parse = require('url').parse;
let debug = require('debug')('express:mock');
const utils = require('./utils');
const transform = require('./transform');

let cwd = process.cwd();
let mockRouteMap = {};

let debugFn = function (type, msg) {
  debug(type + msg);
};

// 用于刷新mock设置
createMiddleware.refresh = function (mockObj) {
  mockRouteMap = {};
  createRoute(mockObj);
};

module.exports = createMiddleware;

function createMiddleware(mockObj, logfn) {
  if (mockObj.entry) {
    let entry = mockObj.entry;
    if (path.isAbsolute(entry)) {
      mockObj = require(entry);
    } else {
      mockObj = require(path.resolve(cwd, entry));
    }
  }

  if (logfn && typeof logfn === 'function') {
    debugFn = logfn;
  }

  createRoute(mockObj);

  return function (req, res, next) {
    let route = matchRoute(req);
    if (route) {
      //match url
      debugFn('matched', `${route.method.toUpperCase()} ${route.path}`);
      let bodyParserMethd = bodyParser.json();
      const contentType = req.get('Content-Type');
      if (contentType === 'text/plain') {
        bodyParserMethd = bodyParser.raw({ type: 'text/plain' });
      } else if (contentType === 'application/x-www-form-urlencoded') {
        bodyParserMethd = bodyParser.urlencoded({ extended: false });
      }
      bodyParserMethd(req, res, function () {
        const result = utils.pathMatch({ sensitive: false, strict: false, end: false });
        const match = result(route.path);
        req.params = match(parse(req.url).pathname);
        route.handler(req, res, next);
      });
    } else {
      next();
    }
  };
}

function createRoute(mockModule) {
  let mockConfList;
  if (!Array.isArray(mockModule)) {
    mockConfList = transform(mockModule);
  } else {
    mockConfList = mockModule;
  }
  mockConfList.forEach((mockConf, index) => {
    let method = mockConf.method || 'get';
    let path = mockConf.path;
    let handler = mockConf.handler;
    if (!path || !handler) {
      throw Error(`missing path or handler at index ${index} with path: ${path}`);
    }
    let regexp = new RegExp('^' + path.replace(/(:\w*)[^/]/gi, '(.*)') + '$');
    let route = { path, method: method.toLowerCase(), regexp, handler };
    if (!mockRouteMap[method]) {
      mockRouteMap[method] = [];
    }
    debugFn('createRoute', ': path:' + route.path + '  method:' + route.method);
    mockRouteMap[method].push(route);
  });
}

function matchRoute(req) {
  let url = req.url;
  let method = req.method.toLowerCase();
  let uri = url.replace(/\?.*$/, '');
  debugFn('matchRoute', ':(path:' + url + '  method:' + method + ')');
  let routerList = mockRouteMap[method];
  return routerList && routerList.find((item) => item.path === uri || item.regexp.test(uri));
}
