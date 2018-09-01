import jimp from 'jimp';
import mime from 'mime';
import path from 'path';
import { isString, isFunction, isNull } from 'util';
import toIco from 'to-ico';

import {
  enforceArray,
  createHash,
  emitAsset,
  flattenArray,
  makeTag,
  sanitizeUrl,
} from './helpers';

const supportedOutputMimeTypes = [
  jimp.MIME_PNG,
  jimp.MIME_JPEG,
  mime.getType('ico'),
];

const getSanitizeIconSet = (set, options, compilation) => {
  const iconsOptions = options.output.icons;
  const src = set.src || iconsOptions.src;
  const destination = isString(set.destination)
    ? set.destination
    : iconsOptions.destination;
  const filename = set.filename || iconsOptions.filename;
  const sizes = enforceArray(set.sizes);
  const destinationMimeType = mime.getType(
    path.extname(isFunction(filename) ? filename({}) : filename),
  );
  const srcMimeType = mime.getType(path.extname(src));
  const mimeType = destinationMimeType || srcMimeType;

  const globalPublicPath = options.output.icons.publicPath;
  const localPublicPath = isString(set.publicPath)
    ? set.publicPath
    : globalPublicPath;
  const defaultPublicPath = compilation.options.output.publicPath;
  const publicPath = isString(localPublicPath)
    ? localPublicPath
    : defaultPublicPath;

  const sanitizedIconSet = {
    ...set,
    src,
    destination,
    filename,
    sizes,
    mimeType,
    publicPath,
  };

  return sanitizedIconSet;
};

const getIconSetList = (list, setName, options, compilation) => {
  if (isNull(list)) {
    return [];
  }

  const iconSetList = flattenArray(
    enforceArray(list).map(iconSet => {
      const cleanSet = getSanitizeIconSet(iconSet, options, compilation);
      const set = cleanSet.sizes.map(size => {
        const { sizes, ...cleanSetWithoutSizes } = cleanSet;
        const srcExtension = path.extname(cleanSet.src);
        const name = path.basename(cleanSet.src, srcExtension);
        const fullSize = `${size}x${size}`;
        const { filename } = cleanSetWithoutSizes;
        const outputExtension =
          path.extname(isFunction(filename) ? filename({}) : filename) ||
          srcExtension;
        const cacheKey = [cleanSet.src, fullSize, outputExtension].join('$');

        const setToAppend = {
          ...cleanSetWithoutSizes,
          name,
          extension: srcExtension,
          set: setName,
          width: size,
          height: size,
          size: fullSize,
          cacheKey,
        };

        return setToAppend;
      });

      return set;
    }),
  );

  return iconSetList;
};

const getIconsListFromOptions = async (options, compilation) => {
  const { safari, manifest, favIcons, shortcutIcon } = options;
  const iconsList = [
    ...getIconSetList(safari.maskIcon, 'maskIcon', options, compilation),
    ...getIconSetList(
      safari.startupImage,
      'safariStartupImage',
      options,
      compilation,
    ),
    ...getIconSetList(safari.icons, 'safariIcons', options, compilation),
    ...getIconSetList(manifest.icons, 'manifestIcons', options, compilation),
    ...getIconSetList(favIcons, 'favIcons', options, compilation),
    ...getIconSetList(shortcutIcon, 'shortcutIcon', options, compilation),
  ];

  return iconsList;
};

const getAssetsMapFromIconsList = async (iconsList, options) => {
  const resizingAlgorithm = options.output.icons.pixelArt
    ? jimp.RESIZE_NEAREST_NEIGHBOR
    : null;

  const iconsDistinctList = Object.values(
    iconsList.reduce((acc, icon) => {
      acc[icon.cacheKey] = icon;

      return acc;
    }, {}),
  );

  const assetsList = await Promise.all(
    iconsDistinctList.map(
      async (
        {
          src,
          width,
          height,
          mimeType,
          filename,
          destination,
          cacheKey,
          publicPath,
        },
        index,
      ) => {
        if (!supportedOutputMimeTypes.includes(mimeType)) {
          throw new Error('Unsupported output mime type:', mimeType);
        }

        const shouldOutputIco = mimeType === mime.getType('ico');
        const outputMimetype = shouldOutputIco ? jimp.MIME_PNG : mimeType;

        const buffer = await jimp
          .read(src)
          .then(img =>
            img
              .resize(width, height, resizingAlgorithm)
              .getBufferAsync(outputMimetype),
          )
          // eslint-disable-next-line no-console
          .catch(error => console.error('Error:', error));

        const icoBuffer = shouldOutputIco ? await toIco([buffer]) : null;
        const finalBuffer = icoBuffer || buffer;
        const hash = createHash(finalBuffer);

        const tags = {
          ...iconsList[index],
          hash,
        };

        const assetFilename = isFunction(filename) ? filename(tags) : filename;
        const assetPath = path.join(
          isFunction(destination) ? destination(tags) : destination,
          assetFilename,
        );

        const asset = {
          cacheKey,
          buffer: finalBuffer,
          hash,
          path: assetPath,
          publicPath: sanitizeUrl(`${publicPath}/${assetPath}`),
        };

        return asset;
      },
    ),
  );

  const assetsMap = assetsList.reduce((acc, { cacheKey, ...asset }) => {
    acc[cacheKey] = asset;

    return acc;
  }, {});

  return assetsMap;
};

const icons = {
  async generateAssets(options, compilation) {
    const iconsList = await getIconsListFromOptions(options, compilation);
    const assetsMap = await getAssetsMapFromIconsList(iconsList, options);

    return { iconsList, assetsMap };
  },

  async emitIconAssets(assetsMap, compilation) {
    await Promise.all(
      Object.values(assetsMap).map(async ({ path: filepath, buffer }) => {
        emitAsset(compilation, filepath, buffer);
      }),
    );
  },

  async getHtmlHeaders(options, iconsList, assetsMap) {
    const { webAppCapable, webAppTitle, webAppStatusBarStyle } = options.safari;

    const metaTagTemplates = [
      {
        hidden: !webAppCapable,
        name: 'meta',
        attributes: { name: 'mobile-web-app-capable', content: 'yes' },
      },
      {
        hidden: !webAppCapable,
        name: 'meta',
        attributes: { name: 'apple-mobile-web-app-capable', content: 'yes' },
      },
      {
        hidden: !webAppTitle,
        name: 'meta',
        attributes: {
          name: 'apple-mobile-web-app-title',
          content: webAppTitle,
        },
      },
      {
        hidden: !webAppStatusBarStyle,
        name: 'meta',
        attributes: {
          name: 'apple-mobile-web-app-status-bar-style',
          content: webAppStatusBarStyle,
        },
      },
    ];

    const headers = [
      ...metaTagTemplates
        .filter(({ hidden }) => !hidden)
        .map(({ name, attributes }) => makeTag(name, attributes)),
    ];

    const linkTagTemplates = [
      {
        iconsSet: iconsList.filter(({ set }) => set === 'shortcutIcon'),
        name: 'link',
        getAttributes: ({ size, mimeType, publicPath }) => ({
          rel: 'shortcut icon',
          sizes: size,
          type: mimeType,
          href: publicPath,
        }),
      },
      {
        iconsSet: iconsList.filter(({ set }) => set === 'favIcons'),
        name: 'link',
        getAttributes: ({ size, mimeType, publicPath }) => ({
          rel: 'icon',
          sizes: size,
          type: mimeType,
          href: publicPath,
        }),
      },
      {
        iconsSet: iconsList.filter(({ set }) => set === 'safariIcons'),
        name: 'link',
        getAttributes: ({ size, publicPath }) => ({
          rel: 'apple-touch-icon',
          sizes: size,
          href: publicPath,
        }),
      },
      {
        iconsSet: iconsList.filter(({ set }) => set === 'safariStartupImage'),
        name: 'link',
        getAttributes: ({ size, publicPath }) => ({
          rel: 'apple-touch-startup-image',
          sizes: size,
          href: publicPath,
        }),
      },
      {
        iconsSet: iconsList.filter(({ set }) => set === 'safariMaskIcon'),
        name: 'link',
        getAttributes: ({ color, publicPath }) => ({
          rel: 'mask-icon',
          href: publicPath,
          color,
        }),
      },
    ];

    headers.push(
      ...flattenArray(
        linkTagTemplates
          .filter(template => !!template.iconsSet && template.iconsSet.length)
          .map(({ iconsSet, name, getAttributes }) =>
            iconsSet.map(({ cacheKey, color, size, mimeType }) =>
              makeTag(
                name,
                getAttributes({
                  color,
                  size,
                  mimeType,
                  publicPath: assetsMap[cacheKey].publicPath,
                }),
              ),
            ),
          ),
      ),
    );

    return headers;
  },
};

export default icons;
