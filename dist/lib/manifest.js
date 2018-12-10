"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es6.array.from");

require("core-js/modules/es6.regexp.to-string");

require("core-js/modules/es7.symbol.async-iterator");

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.promise");

var _util = require("util");

var _helpers = require("./helpers");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var members = ['name', 'short_name', 'description', 'start_url', 'display', 'orientation', 'background_color', 'theme_color', 'lang', 'dir', 'prefer_related_applications', 'related_applications', 'scope'];

var buildDictionary =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (manifestOptions, keys, iconsList, assetsMap) {
    var icons = iconsList.filter(function (_ref2) {
      var set = _ref2.set;
      return set === 'manifestIcons';
    }).map(function (_ref3) {
      var cacheKey = _ref3.cacheKey,
          size = _ref3.size,
          mimeType = _ref3.mimeType;
      var publicPath = assetsMap[cacheKey].publicPath;
      var iconInfo = {
        src: publicPath,
        sizes: size,
        type: mimeType
      };
      return iconInfo;
    });

    var dictionary = _objectSpread({}, keys.reduce(function (acc, key) {
      var value = manifestOptions[(0, _helpers.toCamel)(key)];

      if (!(0, _util.isNull)(value) && !(0, _util.isUndefined)(value)) {
        acc[key] = value;
      }

      return acc;
    }, {}), {
      icons
    });

    return dictionary;
  });

  return function buildDictionary(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

var getStringFromDictionary = function getStringFromDictionary(dictionary) {
  var string = `${JSON.stringify(dictionary, null, 2)}\n`;
  return string;
};

var manifest = {
  getDictionary(options, iconsList, assetsMap) {
    return _asyncToGenerator(function* () {
      var object = yield buildDictionary(options.manifest, members, iconsList, assetsMap);
      return object;
    })();
  },

  getHtmlHeaders(options) {
    return _asyncToGenerator(function* () {
      var _options$output$manif = options.output.manifest,
          publicPath = _options$output$manif.publicPath,
          filename = _options$output$manif.filename,
          _options$manifest = options.manifest,
          appName = _options$manifest.name,
          themeColor = _options$manifest.themeColor,
          startUrl = _options$manifest.startUrl;
      var manifestUrl = `${publicPath}${filename}`;
      var tagTemplates = [{
        name: 'link',
        attributes: {
          rel: 'manifest',
          href: manifestUrl
        }
      }, {
        hidden: !appName,
        name: 'meta',
        attributes: {
          name: 'application-name',
          content: appName
        }
      }, {
        hidden: !themeColor,
        name: 'meta',
        attributes: {
          name: 'theme-color',
          content: themeColor
        }
      }, {
        hidden: !startUrl,
        name: 'meta',
        attributes: {
          name: 'msapplication-starturl',
          content: startUrl
        }
      }];

      var headers = _toConsumableArray(tagTemplates.filter(function (_ref4) {
        var hidden = _ref4.hidden;
        return !hidden;
      }).map(function (_ref5) {
        var name = _ref5.name,
            attributes = _ref5.attributes;
        return (0, _helpers.makeTag)(name, attributes);
      }));

      return headers;
    })();
  },

  emitDictionaryAsset(dictionary, compilation, options) {
    var filename = options.output.manifest.filename;
    var content = getStringFromDictionary(dictionary);
    (0, _helpers.emitAsset)(compilation, filename, content);
  }

};
var _default = manifest;
exports.default = _default;