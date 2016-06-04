'use strict';

const DynamoDB = require('./DynamoDb');

const TABLE_NAME = 'Platform';

module.exports = class Schema extends DynamoDB {
  constructor() {
    super(TABLE_NAME, ['id', 'name']);
  }

  list(platformId) {
    let params = this.buildQuery(platformId || this.platformId, 'platform');
    return this.query(params);
  }
}
