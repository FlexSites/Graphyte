'use strict';

const Service = require('./Service');
const Bluebird = require('bluebird');
const { graphql } = require('graphql');
const { mockServer } = require('graphql-tools');

module.exports = class GraphQL extends Service {
  constructor(config) {
    super('GraphQL');
    this.schema = Bluebird.resolve(config.schema);
  }

  execute(query, context = {}, variables) {
    return this.schema.then(schema => {
      console.log('before execute');
      return graphql(schema, query, {}, context, variables);
    })
  }

  mock(query, context, variables) {
    return this.schema.then(schema => {
      return mockServer(schema).query(query);
    })
  }
}
