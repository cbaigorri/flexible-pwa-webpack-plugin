import { isNull, isUndefined } from 'util';

import { toCamel, emitAsset, makeTag } from './helpers';

const members = [
  'name',
  'short_name',
  'description',
  'start_url',
  'display',
  'orientation',
  'background_color',
  'theme_color',
  'lang',
  'dir',
  'prefer_related_applications',
  'related_applications',
  'scope',
];

const buildDictionary = (manifestOptions, keys) => {
  const dictionary = keys.reduce((acc, key) => {
    const value = manifestOptions[toCamel(key)];
    if (!isNull(value) && !isUndefined(value)) {
      acc[key] = value;
    }

    return acc;
  }, {});

  return dictionary;
};

const getStringFromDictionary = dictionary => {
  const string = `${JSON.stringify(dictionary, null, 2)}\n`;

  return string;
};

const manifest = {
  getDictionary(options) {
    const object = buildDictionary(options.manifest, members);

    return object;
  },

  async getHtmlHeaders(options) {
    const {
      output: {
        manifest: { publicPath, filename },
      },
      manifest: { name: appName, themeColor, startUrl },
    } = options;
    const manifestUrl = `${publicPath}${filename}`;

    const tagTemplates = [
      { name: 'link', attributes: { rel: 'manifest', href: manifestUrl } },
      {
        hidden: !appName,
        name: 'meta',
        attributes: { name: 'application-name', content: appName },
      },
      {
        hidden: !themeColor,
        name: 'meta',
        attributes: { name: 'theme-color', content: themeColor },
      },
      {
        hidden: !startUrl,
        name: 'meta',
        attributes: { name: 'msapplication-starturl', content: startUrl },
      },
    ];

    const headers = [
      ...tagTemplates
        .filter(({ hidden }) => !hidden)
        .map(({ name, attributes }) => makeTag(name, attributes)),
    ];

    return headers;
  },

  emitDictionaryAsset(dictionary, compilation, options) {
    const { filename } = options.output.manifest;
    const content = getStringFromDictionary(dictionary);

    emitAsset(compilation, filename, content);
  },
};

export default manifest;
