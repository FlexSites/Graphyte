'use strict';

const Bluebird = require('bluebird');
const Auth0 = require('../services/Auth0');
const errors = require('../lib/errors');

const Unauthorized = errors.UnauthorizedError;

const AUTH0_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJQNk9ORTlHeVhyNk5zYUJhUERwa1BKSTJrQmVocGd4SCIsInNjb3BlcyI6eyJ1c2VycyI6eyJhY3Rpb25zIjpbInJlYWQiXX19LCJpYXQiOjE0NjMyNTc1OTMsImp0aSI6IjVhYWJhZDRlYTcwMDhhODU0NWU5MzA0NDhmZTcxNTBmIn0.Fz-kIYiBHO0cfsbBiisq3DvHz3012kwkcbbwV4nNlIQ';
const AUTH0_SECRET = 'KbZQI-wUFXkKZpqR4HulY7L1kOtB7-kK9GoG1a0aUTOy9StnkQGcxT83VkGk85Yz';

const auth0 = new Auth0({ token: AUTH0_TOKEN, secret: AUTH0_SECRET });


module.exports = function(req, res, next) {
  let token = req.get('Authorization');

  if (!token) return Bluebird.reject(new Unauthorized('Authorization token is required.'));
  console.time('Fetching user');
  return auth0
    .getUserByToken(token.split(' ')[1])
    .then((user) => req.user = user)
    .tap(() => next())
    .catch(next);
}
