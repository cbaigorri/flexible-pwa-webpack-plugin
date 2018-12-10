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

require("core-js/modules/es7.array.includes");

require("core-js/modules/es6.promise");

require("core-js/modules/es7.object.values");

var _jimp = _interopRequireDefault(require("jimp"));

var _mime = _interopRequireDefault(require("mime"));

var _path = _interopRequireDefault(require("path"));

var _util = require("util");

var _toIco = _interopRequireDefault(require("to-ico"));

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var supportedOutputMimeTypes = [_jimp.default.MIME_PNG, _jimp.default.MIME_JPEG, _mime.default.getType('ico')];

var getSanitizeIconSet = function getSanitizeIconSet(set, options, compilation) {
  var iconsOptions = options.output.icons;
  var src = set.src || iconsOptions.src;
  var destination = (0, _util.isString)(set.destination) ? set.destination : iconsOptions.destination;
  var filename = set.filename || iconsOptions.filename;
  var sizes = (0, _helpers.enforceArray)(set.sizes);

  var destinationMimeType = _mime.default.getType(_path.default.extname((0, _util.isFunction)(filename) ? filename({}) : filename));

  var srcMimeType = _mime.default.getType(_path.default.extname(src));

  var mimeType = destinationMimeType || srcMimeType;
  var globalPublicPath = options.output.icons.publicPath;
  var localPublicPath = (0, _util.isString)(set.publicPath) ? set.publicPath : globalPublicPath;
  var defaultPublicPath = compilation.options.output.publicPath;
  var publicPath = (0, _util.isString)(localPublicPath) ? localPublicPath : defaultPublicPath;

  var sanitizedIconSet = _objectSpread({}, set, {
    src,
    destination,
    filename,
    sizes,
    mimeType,
    publicPath
  });

  return sanitizedIconSet;
};

var getIconSetList = function getIconSetList(list, setName, options, compilation) {
  if ((0, _util.isNull)(list)) {
    return [];
  }

  var iconSetList = (0, _helpers.flattenArray)((0, _helpers.enforceArray)(list).map(function (iconSet) {
    var cleanSet = getSanitizeIconSet(iconSet, options, compilation);
    var set = cleanSet.sizes.map(function (size) {
      var sizes = cleanSet.sizes,
          cleanSetWithoutSizes = _objectWithoutProperties(cleanSet, ["sizes"]);

      var srcExtension = _path.default.extname(cleanSet.src);

      var name = _path.default.basename(cleanSet.src, srcExtension);

      var fullSize = `${size}x${size}`;
      var filename = cleanSetWithoutSizes.filename;
      var outputExtension = _path.default.extname((0, _util.isFunction)(filename) ? filename({}) : filename) || srcExtension;
      var cacheKey = [cleanSet.src, fullSize, outputExtension].join('$');

      var setToAppend = _objectSpread({}, cleanSetWithoutSizes, {
        name,
        extension: srcExtension,
        set: setName,
        width: size,
        height: size,
        size: fullSize,
        cacheKey
      });

      return setToAppend;
    });
    return set;
  }));
  return iconSetList;
};

var getIconsListFromOptions =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (options, compilation) {
    var safari = options.safari,
        manifest = options.manifest,
        favIcons = options.favIcons,
        shortcutIcon = options.shortcutIcon;

    var iconsList = _toConsumableArray(getIconSetList(safari.maskIcon, 'maskIcon', options, compilation)).concat(_toConsumableArray(getIconSetList(safari.startupImage, 'safariStartupImage', options, compilation)), _toConsumableArray(getIconSetList(safari.icons, 'safariIcons', options, compilation)), _toConsumableArray(getIconSetList(manifest.icons, 'manifestIcons', options, compilation)), _toConsumableArray(getIconSetList(favIcons, 'favIcons', options, compilation)), _toConsumableArray(getIconSetList(shortcutIcon, 'shortcutIcon', options, compilation)));

    return iconsList;
  });

  return function getIconsListFromOptions(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var getAssetsMapFromIconsList =
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(function* (iconsList, options) {
    var resizingAlgorithm = options.output.icons.pixelArt ? _jimp.default.RESIZE_NEAREST_NEIGHBOR : null;
    var iconsDistinctList = Object.values(iconsList.reduce(function (acc, icon) {
      acc[icon.cacheKey] = icon;
      return acc;
    }, {}));
    var assetsList = yield Promise.all(iconsDistinctList.map(
    /*#__PURE__*/
    function () {
      var _ref4 = _asyncToGenerator(function* (_ref3, index) {
        var src = _ref3.src,
            width = _ref3.width,
            height = _ref3.height,
            mimeType = _ref3.mimeType,
            filename = _ref3.filename,
            destination = _ref3.destination,
            cacheKey = _ref3.cacheKey,
            publicPath = _ref3.publicPath;

        if (!supportedOutputMimeTypes.includes(mimeType)) {
          throw new Error('Unsupported output mime type:', mimeType);
        }

        var shouldOutputIco = mimeType === _mime.default.getType('ico');

        var outputMimetype = shouldOutputIco ? _jimp.default.MIME_PNG : mimeType;
        var buffer = yield _jimp.default.read(src).then(function (img) {
          return img.resize(width, height, resizingAlgorithm).getBufferAsync(outputMimetype);
        }) // eslint-disable-next-line no-console
        .catch(function (error) {
          return console.error('Error:', error);
        });
        var icoBuffer = shouldOutputIco ? yield (0, _toIco.default)([buffer]) : null;
        var finalBuffer = icoBuffer || buffer;
        var hash = (0, _helpers.createHash)(finalBuffer);

        var tags = _objectSpread({}, iconsList[index], {
          hash
        });

        var assetFilename = (0, _util.isFunction)(filename) ? filename(tags) : filename;

        var assetPath = _path.default.join((0, _util.isFunction)(destination) ? destination(tags) : destination, assetFilename);

        var asset = {
          cacheKey,
          buffer: finalBuffer,
          hash,
          path: assetPath,
          publicPath: `${publicPath}/${assetPath}`
        };
        return asset;
      });

      return function (_x5, _x6) {
        return _ref4.apply(this, arguments);
      };
    }()));
    var assetsMap = assetsList.reduce(function (acc, _ref5) {
      var cacheKey = _ref5.cacheKey,
          asset = _objectWithoutProperties(_ref5, ["cacheKey"]);

      acc[cacheKey] = asset;
      return acc;
    }, {});
    return assetsMap;
  });

  return function getAssetsMapFromIconsList(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

var icons = {
  generateAssets(options, compilation) {
    return _asyncToGenerator(function* () {
      var iconsList = yield getIconsListFromOptions(options, compilation);
      var assetsMap = yield getAssetsMapFromIconsList(iconsList, options);
      return {
        iconsList,
        assetsMap
      };
    })();
  },

  emitIconAssets(assetsMap, compilation) {
    return _asyncToGenerator(function* () {
      yield Promise.all(Object.values(assetsMap).map(
      /*#__PURE__*/
      function () {
        var _ref7 = _asyncToGenerator(function* (_ref6) {
          var filepath = _ref6.path,
              buffer = _ref6.buffer;
          (0, _helpers.emitAsset)(compilation, filepath, buffer);
        });

        return function (_x7) {
          return _ref7.apply(this, arguments);
        };
      }()));
    })();
  },

  getHtmlHeaders(options, iconsList, assetsMap) {
    return _asyncToGenerator(function* () {
      var _options$safari = options.safari,
          webAppCapable = _options$safari.webAppCapable,
          webAppTitle = _options$safari.webAppTitle,
          webAppStatusBarStyle = _options$safari.webAppStatusBarStyle;
      var metaTagTemplates = [{
        hidden: !webAppCapable,
        name: 'meta',
        attributes: {
          name: 'mobile-web-app-capable',
          content: 'yes'
        }
      }, {
        hidden: !webAppCapable,
        name: 'meta',
        attributes: {
          name: 'apple-mobile-web-app-capable',
          content: 'yes'
        }
      }, {
        hidden: !webAppTitle,
        name: 'meta',
        attributes: {
          name: 'apple-mobile-web-app-title',
          content: webAppTitle
        }
      }, {
        hidden: !webAppStatusBarStyle,
        name: 'meta',
        attributes: {
          name: 'apple-mobile-web-app-status-bar-style',
          content: webAppStatusBarStyle
        }
      }];

      var headers = _toConsumableArray(metaTagTemplates.filter(function (_ref8) {
        var hidden = _ref8.hidden;
        return !hidden;
      }).map(function (_ref9) {
        var name = _ref9.name,
            attributes = _ref9.attributes;
        return (0, _helpers.makeTag)(name, attributes);
      }));

      var linkTagTemplates = [{
        iconsSet: iconsList.filter(function (_ref10) {
          var set = _ref10.set;
          return set === 'shortcutIcon';
        }),
        name: 'link',
        getAttributes: function getAttributes(_ref11) {
          var size = _ref11.size,
              mimeType = _ref11.mimeType,
              publicPath = _ref11.publicPath;
          return {
            rel: 'shortcut icon',
            sizes: size,
            type: mimeType,
            href: publicPath
          };
        }
      }, {
        iconsSet: iconsList.filter(function (_ref12) {
          var set = _ref12.set;
          return set === 'favIcons';
        }),
        name: 'link',
        getAttributes: function getAttributes(_ref13) {
          var size = _ref13.size,
              mimeType = _ref13.mimeType,
              publicPath = _ref13.publicPath;
          return {
            rel: 'icon',
            sizes: size,
            type: mimeType,
            href: publicPath
          };
        }
      }, {
        iconsSet: iconsList.filter(function (_ref14) {
          var set = _ref14.set;
          return set === 'safariIcons';
        }),
        name: 'link',
        getAttributes: function getAttributes(_ref15) {
          var size = _ref15.size,
              publicPath = _ref15.publicPath;
          return {
            rel: 'apple-touch-icon',
            sizes: size,
            href: publicPath
          };
        }
      }, {
        iconsSet: iconsList.filter(function (_ref16) {
          var set = _ref16.set;
          return set === 'safariStartupImage';
        }),
        name: 'link',
        getAttributes: function getAttributes(_ref17) {
          var size = _ref17.size,
              publicPath = _ref17.publicPath;
          return {
            rel: 'apple-touch-startup-image',
            sizes: size,
            href: publicPath
          };
        }
      }, {
        iconsSet: iconsList.filter(function (_ref18) {
          var set = _ref18.set;
          return set === 'safariMaskIcon';
        }),
        name: 'link',
        getAttributes: function getAttributes(_ref19) {
          var color = _ref19.color,
              publicPath = _ref19.publicPath;
          return {
            rel: 'mask-icon',
            href: publicPath,
            color
          };
        }
      }];
      headers.push.apply(headers, _toConsumableArray((0, _helpers.flattenArray)(linkTagTemplates.filter(function (template) {
        return !!template.iconsSet && template.iconsSet.length;
      }).map(function (_ref20) {
        var iconsSet = _ref20.iconsSet,
            name = _ref20.name,
            getAttributes = _ref20.getAttributes;
        return iconsSet.map(function (_ref21) {
          var cacheKey = _ref21.cacheKey,
              color = _ref21.color,
              size = _ref21.size,
              mimeType = _ref21.mimeType;
          return (0, _helpers.makeTag)(name, getAttributes({
            color,
            size,
            mimeType,
            publicPath: assetsMap[cacheKey].publicPath
          }));
        });
      }))));
      return headers;
    })();
  }

};
var _default = icons;
exports.default = _default;