import jimp from 'jimp';
import mime from 'mime';
import fs from 'fs';
import path from 'path';

import {
  enforceArray,
  createHash,
  emitAsset,
  flattenArray,
  getCompiledString,
  makeTag,
} from './helpers';

const supportedMimeTypes = [jimp.MIME_PNG, jimp.MIME_JPEG];

const arrayToObject = (array, defaultValue) =>
  Object.assign(...array.map(d => ({ [d]: defaultValue })));

const getIconSetsFromOptions = options => [
  options.safari.maskIcon,
  options.safari.startupImage,
  ...options.manifest.icons,
  ...options.favicons,
  ...options.safari.icons,
];

const getIconsMapFromSets = sets =>
  sets.reduce((acc, set) => {
    const { src, sizes } = set;
    const sizesObject = arrayToObject(enforceArray(sizes), null);
    acc[src] = Object.assign(acc[src] || {}, sizesObject);

    return acc;
  }, {});

const getMimeTypeFromImage = src => {
  try {
    fs.readFileSync(src);
  } catch (err) {
    throw new Error(`Unable to open image "${src}".`);
  }

  const mimeType = mime.getType(src);
  if (!supportedMimeTypes.includes(mimeType)) {
    throw new Error(`Unsupported image "${src}" of type "${mimeType}".`);
  }

  return mimeType;
};

const iteraveOverIconsMap = (iconsMap, asyncCallback) =>
  Promise.all(
    Object.keys(iconsMap).map(async src =>
      Promise.all(
        Object.keys(iconsMap[src]).map(size => asyncCallback(src, size)),
      ),
    ),
  );

const iterateOverIconSets = async (iconSets, asyncCallback) =>
  Promise.all(
    iconSets.map(async set =>
      Promise.all(
        enforceArray(set.sizes).map(size => asyncCallback(set, size)),
      ),
    ),
  );

const parseSize = size => {
  const width = Number(size);
  const height = width;

  return { width, height };
};

const getCompiledFilename = (templateString, userTags) => {
  const extension = path.extname(userTags.src);
  const name = path.basename(userTags.src, extension);
  const tags = {
    ...userTags,
    name,
    size: `${userTags.width}x${userTags.height}`,
    ext: extension,
  };

  const compiled = getCompiledString(templateString, tags);

  return compiled;
};

const icons = {
  async generateIconsMap(options, compilation) {
    const iconSets = getIconSetsFromOptions(options);
    const iconsMap = getIconsMapFromSets(iconSets);

    await iteraveOverIconsMap(
      iconsMap,
      async (src, size, filename, destination) => {
        const mimeType = getMimeTypeFromImage(src);
        const { width, height } = parseSize(size);

        const buffer = await jimp
          .read(src)
          .then(img => img.resize(width, height).getBufferAsync(mimeType))
          .catch(error => console.error('Error:', error));

        const hash = createHash(buffer);
        const {
          output: {
            icons: {
              filename: globalFilename,
              destination: globalDestination,
              publicPath: globalPublicPath,
            },
          },
        } = options;
        const userFilename = filename || globalFilename;
        const tags = { src, width, height, hash, mimeType };
        const compiledFilename = getCompiledFilename(userFilename, tags);
        const userDestination =
          destination && destination.startsWith('/')
            ? destination
            : path.join(globalDestination, destination || '');
        const filepath = path.join(userDestination, compiledFilename);
        const defaultPublicPath = compilation.options.output.publicPath;
        const publicPath = `${globalPublicPath ||
          defaultPublicPath}/${filepath}`.replace(/([^:])\/{2,}/g, '$1/');

        iconsMap[src][size] = {
          mimeType,
          buffer,
          size: buffer.length,
          filepath,
          publicPath,
        };
      },
    );

    return iconsMap;
  },

  async emitIconAssets(iconsMap, compilation, options) {
    const iconSets = getIconSetsFromOptions(options);

    await iterateOverIconSets(iconSets, ({ src }, size) =>
      emitAsset(
        compilation,
        iconsMap[src][size].filepath,
        iconsMap[src][size].buffer,
      ),
    );
  },

  async getHtmlHeaders(options, iconsMap) {
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
          content: 'webAppStatusBarStyle',
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
        sets: options.favicons,
        name: 'link',
        getAttributes: ({ size, mimeType, publicPath }) => ({
          rel: 'icon',
          sizes: size,
          type: mimeType,
          href: publicPath,
        }),
      },
      {
        sets: options.safari.icons,
        name: 'link',
        getAttributes: ({ size, publicPath }) => ({
          rel: 'apple-touch-icon',
          sizes: size,
          href: publicPath,
        }),
      },
      {
        sets: [options.safari.startupImage],
        name: 'link',
        getAttributes: ({ size, publicPath }) => ({
          rel: 'apple-touch-startup-image',
          sizes: size,
          href: publicPath,
        }),
      },
      {
        sets: [options.safari.maskIcon],
        name: 'link',
        getAttributes: ({ publicPath, color }) => ({
          rel: 'mask-icon',
          href: publicPath,
          color,
        }),
      },
    ];

    headers.push(
      ...flattenArray(
        await Promise.all(
          linkTagTemplates.map(({ sets, name, getAttributes }) =>
            iterateOverIconSets(sets, ({ src, color }, size) => {
              const { mimeType, publicPath } = iconsMap[src][size];
              const compiledHeader = makeTag(
                name,
                getAttributes({
                  color,
                  size: `${size}x${size}`,
                  mimeType,
                  publicPath,
                }),
              );

              return compiledHeader;
            }),
          ),
        ),
      ),
    );

    return headers;
  },
};

export default icons;
