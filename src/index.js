import { isNull } from 'util';

import manifest from './lib/manifest';
import icons from './lib/icons';
import { injectHeadersToHtml } from './lib/helpers';

const FlexiblePwaWebpackPlugin = class {
  static pluginKey = 'flexible-pwa-webpack-plugin';

  constructor(options = {}) {
    this.options = options;
    this.manifestDictionary = null;
    this.htmlHeaders = [];
    this.iconsList = [];
    this.assetsMap = {};
  }

  apply(compiler) {
    const { hooks } = compiler;
    const { pluginKey } = FlexiblePwaWebpackPlugin;

    hooks.make.tapPromise(pluginKey, async compilation => {
      const { iconsList, assetsMap } = await icons.generateAssets(
        this.options,
        compilation,
      );
      this.iconsList = iconsList;
      this.assetsMap = assetsMap;

      const { htmlWebpackPluginBeforeHtmlProcessing } = compilation.hooks;
      if (!htmlWebpackPluginBeforeHtmlProcessing) {
        return;
      }

      this.manifestDictionary = await manifest.getDictionary(
        this.options,
        this.iconsList,
        this.assetsMap,
      );
      if (this.options.output.manifest.injectHtml) {
        this.htmlHeaders.push(...(await manifest.getHtmlHeaders(this.options)));
      }

      if (this.options.output.icons.injectHtml) {
        this.htmlHeaders.push(
          ...(await icons.getHtmlHeaders(
            this.options,
            this.iconsList,
            this.assetsMap,
          )),
        );
      }

      htmlWebpackPluginBeforeHtmlProcessing.tap(pluginKey, htmlPluginData => {
        /* eslint-disable no-param-reassign */
        htmlPluginData.html = injectHeadersToHtml(
          htmlPluginData.html,
          this.htmlHeaders,
        );
        /* eslint-enable no-param-reassign */
      });
    });

    hooks.emit.tapPromise(pluginKey, async compilation => {
      if (!isNull(this.manifestDictionary)) {
        manifest.emitDictionaryAsset(
          this.manifestDictionary,
          compilation,
          this.options,
        );
      }

      await icons.emitIconAssets(this.assetsMap, compilation);
    });
  }
};

module.exports = FlexiblePwaWebpackPlugin;
