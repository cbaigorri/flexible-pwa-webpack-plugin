import { isNull } from 'util';

import manifest from './lib/manifest';
import icons from './lib/icons';
import { injectHeadersToHtml } from './lib/helpers';

const FlexibleWebappWebpackPlugin = class {
  static pluginKey = 'flexible-webapp-webpack-plugin';

  constructor(options = {}) {
    this.options = options;
    this.manifestDictionary = null;
    this.htmlHeaders = [];
    this.iconsMap = {};
  }

  apply(compiler) {
    const { hooks } = compiler;
    const { pluginKey } = FlexibleWebappWebpackPlugin;

    hooks.make.tapPromise(pluginKey, async compilation => {
      this.iconsMap = await icons.generateIconsMap(this.options, compilation);

      const { htmlWebpackPluginBeforeHtmlProcessing } = compilation.hooks;
      if (!htmlWebpackPluginBeforeHtmlProcessing) {
        return;
      }

      this.manifestDictionary = manifest.getDictionary(this.options);
      if (this.options.output.manifest.injectHtml) {
        this.htmlHeaders.push(...(await manifest.getHtmlHeaders(this.options)));
      }

      if (this.options.output.icons.injectHtml) {
        this.htmlHeaders.push(
          ...(await icons.getHtmlHeaders(this.options, this.iconsMap)),
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

      const iconAssets = await icons.emitIconAssets(
        this.iconsMap,
        compilation,
        this.options,
      );

      const stats = {
        manifest: this.manifestDictionary,
        htmlHeaders: this.htmlHeaders,
        iconAssets,
      };
      console.log(stats);
    });
  }
};

module.exports = FlexibleWebappWebpackPlugin;
