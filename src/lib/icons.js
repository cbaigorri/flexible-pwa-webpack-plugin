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
  iterateOverIconSets,
  parseSize,
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
    const sizesObject = arrayToObject(
      enforceArray(sizes).map(size => parseSize(size).wxh),
      null,
    );
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

const getCompiledFilename = (templateString, userTags) => {
  const extension = path.extname(userTags.src);
  const name = path.basename(userTags.src, extension);
  const tags = {
    ...userTags,
    name,
    size: userTags.wxh,
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
        const { width, height, wxh } = parseSize(size);
        const resizingAlgorithm = options.output.icons.pixelPerfect
          ? jimp.RESIZE_NEAREST_NEIGHBOR
          : jimp.RESIZE_BILINEAR;

        const buffer = await jimp
          .read(src)
          .then(img =>
            img
              .resize(width, height, resizingAlgorithm)
              .getBufferAsync(mimeType),
          )
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
        const tags = { src, width, height, wxh, hash, mimeType };
        const compiledFilename = getCompiledFilename(userFilename, tags);
        const userDestination =
          destination && destination.startsWith('/')
            ? destination
            : path.join(globalDestination, destination || '');
        const filepath = path.join(userDestination, compiledFilename);
        const defaultPublicPath = compilation.options.output.publicPath;
        const publicPath = `${globalPublicPath ||
          defaultPublicPath}/${filepath}`.replace(/([^:])\/{2,}/g, '$1/');
        const key = src;

        iconsMap[key][wxh] = {
          src,
          mimeType,
          buffer,
          size: buffer.length,
          filepath,
          publicPath,
          width,
          height,
        };
      },
    );

    console.log('____', iconsMap);

    return iconsMap;
  },

  async emitIconAssets(iconsMap, compilation, options) {
    const iconSets = getIconSetsFromOptions(options);

    await iterateOverIconSets(iconSets, ({ src }, size) => {
      const { wxh } = parseSize(size);
      return emitAsset(
        compilation,
        iconsMap[src][wxh].filepath,
        iconsMap[src][wxh].buffer,
      );
    });
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
        getAttributes: ({ wxh, mimeType, publicPath }) => ({
          rel: 'icon',
          sizes: wxh,
          type: mimeType,
          href: publicPath,
        }),
      },
      {
        sets: options.safari.icons,
        name: 'link',
        getAttributes: ({ wxh, publicPath }) => ({
          rel: 'apple-touch-icon',
          sizes: wxh,
          href: publicPath,
        }),
      },
      {
        sets: [options.safari.startupImage],
        name: 'link',
        getAttributes: ({ wxh, publicPath }) => ({
          rel: 'apple-touch-startup-image',
          sizes: wxh,
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
              const { wxh } = parseSize(size);
              const { mimeType, publicPath } = iconsMap[src][wxh];
              const compiledHeader = makeTag(
                name,
                getAttributes({
                  color,
                  wxh,
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
