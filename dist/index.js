"use strict";

require("core-js/modules/es6.array.from");

require("core-js/modules/es6.regexp.to-string");

require("core-js/modules/es7.symbol.async-iterator");

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.promise");

var _util = require("util");

var _manifest = _interopRequireDefault(require("./lib/manifest"));

var _icons = _interopRequireDefault(require("./lib/icons"));

var _helpers = require("./lib/helpers");

var _class, _temp;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var FlexiblePwaWebpackPlugin = (_temp = _class =
/*#__PURE__*/
function () {
  function FlexiblePwaWebpackPlugin() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, FlexiblePwaWebpackPlugin);

    this.options = options;
    this.manifestDictionary = null;
    this.htmlHeaders = [];
    this.iconsList = [];
    this.assetsMap = {};
  }

  _createClass(FlexiblePwaWebpackPlugin, [{
    key: "apply",
    value: function apply(compiler) {
      var _this = this;

      var hooks = compiler.hooks;
      var pluginKey = FlexiblePwaWebpackPlugin.pluginKey;
      hooks.make.tapPromise(pluginKey,
      /*#__PURE__*/
      function () {
        var _ref = _asyncToGenerator(function* (compilation) {
          var _ref2 = yield _icons.default.generateAssets(_this.options, compilation),
              iconsList = _ref2.iconsList,
              assetsMap = _ref2.assetsMap;

          _this.iconsList = iconsList;
          _this.assetsMap = assetsMap;
          _this.manifestDictionary = yield _manifest.default.getDictionary(_this.options, _this.iconsList, _this.assetsMap);
          var htmlWebpackPluginBeforeHtmlProcessing = compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing;

          if (!htmlWebpackPluginBeforeHtmlProcessing) {
            return;
          }

          if (_this.options.output.manifest.injectHtml) {
            var _this$htmlHeaders;

            (_this$htmlHeaders = _this.htmlHeaders).push.apply(_this$htmlHeaders, _toConsumableArray((yield _manifest.default.getHtmlHeaders(_this.options))));
          }

          if (_this.options.output.icons.injectHtml) {
            var _this$htmlHeaders2;

            (_this$htmlHeaders2 = _this.htmlHeaders).push.apply(_this$htmlHeaders2, _toConsumableArray((yield _icons.default.getHtmlHeaders(_this.options, _this.iconsList, _this.assetsMap))));
          }

          htmlWebpackPluginBeforeHtmlProcessing.tap(pluginKey, function (htmlPluginData) {
            // eslint-disable-next-line no-param-reassign
            htmlPluginData.html = (0, _helpers.injectHeadersToHtml)(htmlPluginData.html, _this.htmlHeaders);
          });
        });

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
      hooks.emit.tapPromise(pluginKey,
      /*#__PURE__*/
      function () {
        var _ref3 = _asyncToGenerator(function* (compilation) {
          if (!(0, _util.isNull)(_this.manifestDictionary)) {
            _manifest.default.emitDictionaryAsset(_this.manifestDictionary, compilation, _this.options);
          }

          yield _icons.default.emitIconAssets(_this.assetsMap, compilation);
        });

        return function (_x2) {
          return _ref3.apply(this, arguments);
        };
      }());
    }
  }]);

  return FlexiblePwaWebpackPlugin;
}(), _defineProperty(_class, "pluginKey", 'flexible-pwa-webpack-plugin'), _temp);
module.exports = FlexiblePwaWebpackPlugin;