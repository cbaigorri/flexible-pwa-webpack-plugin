"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeTag = exports.flattenArray = exports.enforceArray = exports.createHash = exports.emitAsset = exports.injectHeadersToHtml = exports.toCamel = void 0;

require("core-js/modules/es6.array.from");

require("core-js/modules/es6.regexp.to-string");

require("core-js/modules/es7.symbol.async-iterator");

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.promise");

require("core-js/modules/es6.regexp.replace");

var _util = require("util");

var _crypto = _interopRequireDefault(require("crypto"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var toCamel = function toCamel(string) {
  return string.replace(/([_-])([a-z])/g, function (c) {
    return c[1].toUpperCase();
  });
};

exports.toCamel = toCamel;

var injectHeadersToHtml = function injectHeadersToHtml(html, headers) {
  var indentSize = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 2;

  if (!headers.length) {
    return html;
  }

  var indent = ' '.repeat(indentSize);
  var separator = `\n${indent}`;
  var htmlHeaders = `${indent}${headers.join(separator)}\n`;
  var updatedHtml = html.replace(/(<\/head>)/i, `${htmlHeaders}$&`);
  return updatedHtml;
};

exports.injectHeadersToHtml = injectHeadersToHtml;

var emitAsset =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (compilation, filename, content) {
    // eslint-disable-next-line no-param-reassign
    compilation.assets[filename] = {
      source: function source() {
        return content;
      },
      size: function size() {
        return content.length;
      }
    };
  });

  return function emitAsset(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

exports.emitAsset = emitAsset;

var createHash = function createHash(buffer) {
  return _crypto.default.createHash('md5').update(buffer).digest('hex');
};

exports.createHash = createHash;

var enforceArray = function enforceArray(values) {
  return (0, _util.isArray)(values) ? values : [values];
};

exports.enforceArray = enforceArray;

var flattenArray = function flattenArray(list) {
  return list.reduce(function (a, b) {
    return a.concat(Array.isArray(b) ? flattenArray(b) : b);
  }, []);
};

exports.flattenArray = flattenArray;

var makeTag = function makeTag(name, attributes) {
  return [`<${name}`].concat(_toConsumableArray(Object.keys(attributes).map(function (key) {
    return `${key}="${attributes[key]}"`;
  })), ['/>']).join(' ');
};

exports.makeTag = makeTag;