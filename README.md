# Flexible PWA Webpack Plugin

[![NPM version](https:/img.shields.io/npm/v/favicons.svg)](https://www.npmjs.org/package/flexible-pwa-webpack-plugin)

A flexible webpack plugin for generating favicons, manifest and injecting HTML header tags. If you want full control over what is generated and where, go for it. Only 3 dependencies. Requires Node 4+.

## Installation

```shell
$ npm install flexible-pwa-webpack-plugin
```

## Basic Usage

Add the plugin to your webpack config as follows:

```javascript
const FlexiblePwaWebpackPlugin = require('flexible-pwa-webpack-plugin');

...

plugins: [
  new FlexiblePwaWebpackPlugin({
    output: {
      manifest: {
        filename: 'manifest.json',
        publicPath: 'https://my-cdn.com/',
        injectHtml: true,
      },
      icons: {
        src: path.join(__dirname, 'assets', 'logo.png'),
        destination: path.join('img', 'app-icons'),
        filename: ({ size, extension, /* name, width, height, hash */ })
          => `icon-${size}${extension}`,
        publicPath: null,
        pixelArt: false,
        injectHtml: true,
      },
    },
    manifest: {
      name: 'Flexible Progressive Web App Webpack Plugin',
      shortName: 'PWA',
      description: 'A flexible PWA webpack plugin.',
      lang: 'en',
      startUrl: '/?utm_source=homescreen',
      display: 'standalone',
      orientation: 'any',
      backgroundColor: '#ffffff',
      themeColor: '#ffffff',
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
      webAppTitle: 'Flexible Progressive Web App Webpack Plugin',
      webAppStatusBarStyle: 'black-translucent',
      startupImage: null,
      maskIcon: null,
      icons: [{ sizes: [76, 120, 152, 180] }],
    },
  }),
]
```

### HTML Injection

In combination with [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin) it will also inject the necessary html for you:

> **Note**: `html-webpack-plugin` _must_ come before `flexible-pwa-webpack-plugin` in the plugins array.

```html
<link rel="manifest" href="/manifest.json" />
<meta name="application-name" content="PWA" />
<meta name="theme-color" content="#ffffff" />
<meta name="msapplication-starturl" content="/?utm_source=homescreen" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="PWA" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="shortcut icon" sizes="32x32" type="image/x-icon" href="/favicon.ico" />
<link rel="shortcut icon" sizes="76x76" type="image/x-icon" href="https://my-cdn.com/img/app-icons/icon-180x180.ico" />
<link rel="icon" sizes="192x192" type="image/png" href="https://my-cdn.com/img/app-icons/icon-76x76.png" />
<link rel="apple-touch-icon" sizes="76x76" href="https://my-cdn.com/img/app-icons/icon-76x76.png" />
<link rel="apple-touch-icon" sizes="120x120" href="https://my-cdn.com/img/app-icons/icon-120x120.png" />
<link rel="apple-touch-icon" sizes="152x152" href="https://my-cdn.com/img/app-icons/icon-152x152.png" />
<link rel="apple-touch-icon" sizes="180x180" href="https://my-cdn.com/img/app-icons/icon-180x180.png" />
```

### manifest.json

It will also create a `manifest.json` for you:

```javascript
{
  "name": "Flexible Progressive Web App Webpack Plugin",
  "short_name": "PWA",
  "description": "A flexible PWA webpack plugin.",
  "start_url": "/?utm_source=homescreen",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "lang": "en",
  "icons": [
    {
      "src": "https://my-cdn.com/img/app-icons/icon-76x76.png",
      "sizes": "76x76",
      "type": "image/png"
    },
    {
      "src": "https://my-cdn.com/img/app-icons/icon-120x120.png",
      "sizes": "120x120",
      "type": "image/png"
    },
    {
      "src": "https://my-cdn.com/img/app-icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "https://my-cdn.com/img/app-icons/icon-180x180.png",
      "sizes": "180x180",
      "type": "image/png"
    },
    {
      "src": "https://my-cdn.com/img/app-icons/icon-76x76.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "https://my-cdn.com/img/app-icons/icon-120x120.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## License

Feel free to push your code if you agree with publishing under the [MIT](https://github.com/olivierpascal/flexible-pwa-webpack-plugin/blob/master/LICENSE) license.
