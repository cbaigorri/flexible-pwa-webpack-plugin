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
  // eslint-disable-next-line no-param-reassign
  compilation.assets[filename] = {
    source: () => content,
    size: () => content.length,
  };
};

export const createHash = buffer =>
  crypto
    .createHash('md5')
    .update(buffer)
    .digest('hex');

export const enforceArray = values => (isArray(values) ? values : [values]);

export const flattenArray = list =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flattenArray(b) : b), []);

export const makeTag = (name, attributes) =>
  [
    `<${name}`,
    ...Object.keys(attributes).map(key => `${key}="${attributes[key]}"`),
    '/>',
  ].join(' ');

export const sanitizeUrl = url => url.replace(/([^:]|^)\/{2,}/g, '$1/');
