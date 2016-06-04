'use strict';

const request = require('request-promise');
const jwt = require('jsonwebtoken');
const Bluebird = require('bluebird');
const Service = require('./Service');
const Unauthorized = require('../lib/errors').UnauthorizedError;

const verify = Bluebird.promisify(jwt.verify, jwt);

module.exports = class Auth0 extends Service {
  constructor(options) {
    super('Auth0');

    this.token = options.token;
    this.secret = new Buffer(options.secret, 'base64');
  }

  verify(token) {
    return verify(token, this.secret)
      .catch(ex => {
        throw new Unauthorized(ex.message)
      });
  }

  getUserByToken(token) {
    return this.verify(token)
      .then(decoded =>
        request({
          method: 'GET',
          uri: `https://flexhub.auth0.com/api/v2/users/${encodeURIComponent(decoded.sub)}`,
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })
      );
  }
}
