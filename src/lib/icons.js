import jimp from 'jimp';
import mime from 'mime';
import fs from 'fs';
import path from 'path';
import promisify from 'util.promisify';

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

const getSanitizeIconSet = (set, options) => {
  const defaultSrc = options.output.icons.src;
  const sanitizedIconSet = {
    ...set,
    src: set.src || defaultSrc,
    sizes: enforceArray(set.sizes),
  };

  return sanitizedIconSet;
};

const getIconSetsFromOptions = options => {
  const iconSets = {
    safariMaskIcon: [options.safari.maskIcon],
    safariStartupImage: [options.safari.startupImage],
    safariIcons: options.safari.icons,
    manifestIcons: options.manifest.icons,
    favicons: options.favicons,
  };

  const sanitizedIconSets = Object.keys(iconSets).reduce((acc, name) => {
    acc[name] = iconSets[name].map(set => getSanitizeIconSet(set, options));

    return acc;
  }, {});

  return sanitizedIconSets;
};

const getIconsMapFromSets = sets =>
  flattenArray(Object.values(sets)).reduce((acc, { src, sizes }) => {
    const sizesObject = arrayToObject(
      sizes.map(size => parseSize(size).wxh),
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

const iterateOverIconsMap = (iconsMap, asyncCallback) =>
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

const genHashMapFromIconsMap = async iconsMap =>
  flattenArray(
    await Promise.all(
      Object.keys(iconsMap).map(async src => {
        const buffer = await promisify(fs.readFile)(src);
        const hash = createHash(buffer);
        const item = {
          src,
          hash,
        };

        return item;
      }),
    ),
  ).reduce((acc, { src, hash }) => {
    acc[src] = hash;

    return acc;
  }, {});

const readExistingFile = (filepath, encoding) => {
  try {
    const content = fs.readFileSync(filepath, encoding);

    return content;
  } catch (error) {
    return null;
  }
};

const readExistingHashMap = (options, compilation) => {
  const { outputPath } = compilation.compiler;
  const filepath = path.join(
    outputPath,
    options.output.icons.destination,
    '.cache.json',
  );
  const iconsHashMap = readExistingFile(filepath, 'utf-8');
  if (!iconsHashMap) {
    return null;
  }

  const parsedIconsHashMap = JSON.parse(iconsHashMap);

  return parsedIconsHashMap;
};

const isAlreadyCached = (options, compilation, existingIconsHashMap, src) => {
  if (!options.output.icons.persistentCache) {
    return false;
  }

  const { context } = compilation.compiler;
  const srcFilepath = path.join(context, src);
  const existingImage = readExistingFile(srcFilepath);

  if (existingImage) {
    const srcExistingHash = existingIconsHashMap[src];
    const srcHash = createHash(existingImage);

    if (srcExistingHash === srcHash) {
      return true;
    }
  }

  return false;
};

const icons = {
  async generateIconsMap(options, compilation) {
    const iconSets = getIconSetsFromOptions(options);
    const iconsMap = getIconsMapFromSets(iconSets);
    const iconsHashMap = await genHashMapFromIconsMap(iconsMap);

    const existingIconsHashMap =
      readExistingHashMap(options, compilation) || {};

    await iterateOverIconsMap(iconsMap, async (src, size) => {
      const shouldIgnore = isAlreadyCached(
        options,
        compilation,
        existingIconsHashMap,
        src,
      );

      const mimeType = getMimeTypeFromImage(src);
      const { width, height, wxh } = parseSize(size);
      const resizingAlgorithm = options.output.icons.pixelArt
        ? jimp.RESIZE_NEAREST_NEIGHBOR
        : null;

      const buffer = !shouldIgnore
        ? await jimp
            .read(src)
            .then(img =>
              img
                .resize(width, height, resizingAlgorithm)
                .getBufferAsync(mimeType),
            )
            .catch(error => console.error('Error:', error))
        : null;

      const hash = !shouldIgnore ? createHash(buffer) : null;
      const {
        output: {
          icons: { filename, destination, publicPath: globalPublicPath },
        },
      } = options;
      const tags = { src, width, height, wxh, hash, mimeType };
      const compiledFilename = getCompiledFilename(filename, tags);
      const filepath = path.join(destination, compiledFilename);
      const defaultPublicPath = compilation.options.output.publicPath;
      const publicPath = `${globalPublicPath ||
        defaultPublicPath}/${filepath}`.replace(/([^:])\/{2,}/g, '$1/');
      const key = src;

      iconsMap[key][wxh] = {
        src,
        mimeType,
        buffer,
        size: buffer ? buffer.length : 0,
        filepath,
        publicPath,
        width,
        height,
        hash,
      };
    });

    return { iconSets, iconsMap, iconsHashMap };
  },

  async emitIconAssets(iconsMap, iconsHashMap, compilation, options) {
    const iconSets = getIconSetsFromOptions(options);

    await iterateOverIconSets(iconSets, ({ src }, size) => {
      const { wxh } = parseSize(size);
      const { filepath, buffer } = iconsMap[src][wxh];

      if (buffer) {
        emitAsset(compilation, filepath, buffer);
      }
    });

    if (options.output.icons.persistentCache) {
      const hashMapFilepath = `${options.output.icons.destination}/.cache.json`;
      const hashMapContent = JSON.stringify(iconsHashMap, null, 2);
      emitAsset(compilation, hashMapFilepath, hashMapContent);
    }
  },

  async getHtmlHeaders(options, iconSets, iconsMap) {
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
        sets: iconSets.favicons,
        name: 'link',
        getAttributes: ({ wxh, mimeType, publicPath }) => ({
          rel: 'icon',
          sizes: wxh,
          type: mimeType,
          href: publicPath,
        }),
      },
      {
        sets: iconSets.safariIcons,
        name: 'link',
        getAttributes: ({ wxh, publicPath }) => ({
          rel: 'apple-touch-icon',
          sizes: wxh,
          href: publicPath,
        }),
      },
      {
        sets: iconSets.safariStartupImage,
        name: 'link',
        getAttributes: ({ wxh, publicPath }) => ({
          rel: 'apple-touch-startup-image',
          sizes: wxh,
          href: publicPath,
        }),
      },
      {
        sets: iconSets.safariMaskIcon,
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
