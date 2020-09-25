const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const parse = require('url').parse;
let debug = require('debug')('express:mock');
const utils = require('./utils');

let mockRouteMap = {};
let createRouteFn;

createMiddleware.refreshFn = refreshMockFn;

module.exports = createMiddleware;

function refreshMockFn(mockObj) {
  mockRouteMap = {};
  createRouteFn(mockObj);
}

function createMiddleware(mockObj) {
  let createRouteFn = function(mockModule) {
    Object.keys(mockModule).forEach((key) => {
      let { method, path } = utils.parseKey(key);
      let handler = mockModule[key];
      let regexp = new RegExp('^' + path.replace(/(:\w*)[^/]/gi, '(.*)') + '$');
      let route;
      if (typeof handler === 'function') {
        route = {
          path: path,
          method: method,
          regexp: regexp,
          handler: mockModule[key],
        };
      } else {
        route = {
          path: path,
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
  };

  return function(req, res, next) {
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
      bodyParserMethd(req, res, function() {
        const result = utils.pathMatch({ sensitive: false, strict: false, end: false });
        const match = result(route.path);
        req.params = match(parse(req.url).pathname);
        route.handler(req, res, next);
      });
    } else {
      next();
    }
  };

  function matchRoute(req) {
    let path = req.url;
    let method = req.method.toLowerCase();
    let uri = path.replace(/\?.*$/, '');
    debug('matchRoute:(path:' + path + '  method:' + method + ')');
    let routerList = mockRouteMap[method];
    return routerList && routerList.find((item) => item.path === uri || item.regexp.test(uri));
  }
}
