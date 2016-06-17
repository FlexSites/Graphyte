'use strict';

const request = require('request-promise');

module.exports = (defaults, options) => {
  if (typeof options = 'string') options = { uri: options };

  return request(Object.assign({}, defaults, options));
}
