import { isArray } from 'util';
import crypto from 'crypto';

export const toCamel = string =>
  string.replace(/([_-])([a-z])/g, c => c[1].toUpperCase());

export const injectHeadersToHtml = (html, headers, indentSize = 2) => {
  if (!headers.length) {
    return html;
  }

  const indent = ' '.repeat(indentSize);
  const separator = `\n${indent}`;
  const htmlHeaders = `${indent}${headers.join(separator)}\n`;
  const updatedHtml = html.replace(/(<\/head>)/i, `${htmlHeaders}$&`);

  return updatedHtml;
};

export const emitAsset = async (compilation, filename, content) => {
  /* eslint-disable no-param-reassign */
  compilation.assets[filename] = {
    source: () => content,
    size: () => content.length,
  };
  /* eslint-enanle no-param-reassign */
};

export const createHash = data =>
  crypto
    .createHash('md5')
    .update(data)
    .digest('hex');

export const enforceArray = values => (isArray(values) ? values : [values]);

export const flattenArray = list =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flattenArray(b) : b), []);

export const getCompiledString = (templateString, tags) =>
  Object.keys(tags).reduce(
    (acc, key) => acc.replace(`[${key}]`, tags[key]),
    templateString,
  );

export const makeTag = (name, attributes) =>
  [
    `<${name}`,
    ...Object.keys(attributes).map(key => `${key}="${attributes[key]}"`),
    '/>',
  ].join(' ');

export const iterateOverIconSets = async (iconSets, asyncCallback) =>
  Promise.all(
    flattenArray(Object.values(iconSets)).map(async set =>
      Promise.all(set.sizes.map(size => asyncCallback(set, size))),
    ),
  );

export const parseSize = size => {
  const [width, height] = Number(size)
    ? [size, size]
    : size.split('x').map(Number);
  const parsedSize = { width, height, wxh: `${width}x${height}` };

  return parsedSize;
};
