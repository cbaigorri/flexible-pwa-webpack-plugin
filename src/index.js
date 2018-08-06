import manifest from './lib/manifest';

const FlexibleFaviconsWebpackPlugin = class {
  static pluginKey = 'flexible-favicons-webpack-plugin';

  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const { hooks } = compiler;
    const { pluginKey } = FlexibleFaviconsWebpackPlugin;

    hooks.make.tapPromise(`${pluginKey}-make`, async compilation =>
      manifest.inject(compilation, this.options),
    );
  }
};

module.exports = FlexibleFaviconsWebpackPlugin;
