const bodyParser = require('body-parser');
const path = require('path');
const parse = require('url').parse;
let debug = require('debug')('express:mock');
const utils = require('./utils');

let cwd = process.cwd();
let mockRouteMap = {};

// 用于刷新mock设置
createMiddleware.refresh = function (mockObj) {
  mockRouteMap = {};
  createRoute(mockObj);
};

module.exports = createMiddleware;

function createMiddleware(mockObj) {
  if (mockObj.entry) {
    let entry = mockObj.entry;
    if (path.isAbsolute(entry)) {
      mockObj = require(entry);
    } else {
      mockObj = require(path.resolve(cwd, entry));
    }
  }
  createRoute(mockObj);

  return function (req, res, next) {
    let route = matchRoute(req);
    if (route) {
      //match url
      debug(`matched ${route.method.toUpperCase()} ${route.path}`);
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
  Object.keys(mockModule).forEach((key) => {
    let result = utils.parseKey(key);
    let method = result.method;
    let handler = mockModule[key];
    let regexp = new RegExp('^' + result.path.replace(/(:\w*)[^/]/gi, '(.*)') + '$');
    let route;
    if (typeof handler === 'function') {
      route = {
        path: result.path,
        method: method,
        regexp: regexp,
        handler: mockModule[key],
      };
    } else {
      route = {
        path: result.path,
        method: method,
        regexp: regexp,
        handler: (req, res) => res.json(mockModule[key]),
      };
    }
    if (!mockRouteMap[method]) {
      mockRouteMap[method] = [];
    }
    mockRouteMap[method].push(route);
  });
  debug('createRoute:\n' + JSON.stringify(mockRouteMap, null, 4));
}

function matchRoute(req) {
  let url = req.url;
  let method = req.method.toLowerCase();
  let uri = url.replace(/\?.*$/, '');
  debug('matchRoute:(path:' + url + '  method:' + method + ')');
  let routerList = mockRouteMap[method];
  return routerList && routerList.find((item) => item.path === uri || item.regexp.test(uri));
}
