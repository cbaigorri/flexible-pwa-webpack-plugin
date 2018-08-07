# Flexible Web App Webpack Plugin

[![NPM version](https://img.shields.io/npm/v/favicons.svg)](https://www.npmjs.org/package/flexible-webapp-webpack-plugin)

A flexible webpack plugin for generating favicons, manifest and injecting HTML header tags. If you want full control over what is generated and where, go for it. Only 3 dependencies. Requires Node 4+.

## Installation

```shell
$ npm install flexible-pwa-webpack-plugin
```

## Basic Usage

Add the plugin to your webpack config as follows:

```javascript
const FlexiblePwaWebpackPlugin = require('flexible-pwa-webpack-plugin')

...

plugins: [
  new FlexiblePwaWebpackPlugin({
    output: {
      manifest: {
        filename: 'manifest.json',
        publicPath: '/',
        injectHtml: true,
      },
      icons: {
        src: path.join(cwd, assetsDirname, 'logo.png'),
        destination: path.join('img', 'app-icons'),
        filename: ({ size, extension }) => `icon-${size}${extension}`,
        publicPath: null,
        pixelArt: false,
        persistentCache: null,
        injectHtml: true,
      },
    },
    manifest: {
      name: webApp.name,
      shortName: webApp.shortName,
      description: webApp.description,
      lang: webApp.lang,
      startUrl: webApp.startUrl,
      display: webApp.display,
      orientation: webApp.orientation,
      backgroundColor: webApp.backgroundColor,
      themeColor: webApp.themeColor,
      icons: [{ sizes: [76, 120, 152, 180, 192, 512] }],
    },
    favIcons: [{ sizes: [192] }],
    shortcutIcon: [
      {
        sizes: [32],
        destination: '',
        filename: 'favicon.ico',
        publicPath: '/',
      },
      {
        sizes: [76],
        filename: ({ size }) => `icon-${size}.ico`,
      },
    ],
    safari: {
      webAppCapable: true,
      webAppTitle: webApp.name,
      webAppStatusBarStyle: webApp.statusBarStyle,
      startupImage: null,
      maskIcon: null,
      icons: [{ sizes: [76, 120, 152, 180] }],
    },
  }),
]
```
