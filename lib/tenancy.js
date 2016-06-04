'use strict';

const Tenancy = require('tenant').Tenancy;
const GraphQL = require('../services/GraphQL');
const redis = require('redis');
const Bluebird = require('bluebird');
const { get, set } = require('object-path');
const Platform = require('../services/Platform');
const Schema = require('../services/Schema');
const MongoDB = require('../services/MongoDb');
const parse = require('../lib/graph');

Bluebird.promisifyAll(redis.RedisClient.prototype);
Bluebird.promisifyAll(redis.Multi.prototype);

const cache = {};

let tenants = new Tenancy({
  connections: {
    graphql(config) {
      return new GraphQL(config);
    },
    mongodb(config) {
      return new MongoDB(config);
    }
  }
});

let stages = new Tenancy({
  tenants: {
    development: {
      redis: 'redis://h:p6ljnftvactfk1pmetmuovm18b@ec2-54-225-115-56.compute-1.amazonaws.com:18459',
    }
  },
  connections: {
    redis(config) {
      let key = [config.env, 'redis'];
      let conn = get(cache, key);
      if (conn) return conn;

      conn = redis.createClient(config.redis);

      set(cache, key, conn);

      return conn;
    },
    platform(config) {
      return new Platform();
    },
    schema(config) {
      return new Schema();
    },
    mongodb(config) {
      return new MongoDB(config);
    }
  }
});

function init() {
  let tenant = stages
    .tenant('development');

  let platform = tenant
    .connection('platform');

  let schema = tenant
    .connection('schema');

  platform
    .scan()
    .then(platforms => Bluebird.props(platforms.reduce((prev, { id }) => {
      prev[id] = schema
        .list(id)
        .then(parse)
        .then(schema => tenants.tenant(id, {
          platformId: id,
          schema,
        }))
      return prev;
    }, {})));
}

init();


module.exports = {
  stages,
  tenants,
};
