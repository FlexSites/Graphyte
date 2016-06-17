'use strict';

const AWS = require('aws-sdk');
const Service = require('./Service');
const Bluebird = require('bluebird');
const uuid = require('uuid');
const reserved = require('./dynamo-reserved-words');

AWS.config.setPromisesDependency(Bluebird);

const dynamo = new AWS.DynamoDB({
  region: 'us-west-2',
  // endpoint: 'http://localhost:4567',
})

const docClient = new AWS.DynamoDB.DocumentClient({
  service: dynamo,
});

const _normalizeFields = Symbol('normalizeFields');

module.exports = class DynamoDB extends Service {
  constructor(tableName, fieldNames) {
    super(`${tableName} | DynamoDB`);

    this.fields = this[_normalizeFields](fieldNames);
    this.expressionAttributes = this.fields.reduce((prev, curr) => {
      if (curr.charAt(0) === '#') prev[curr] = curr.substr(1);
      return prev;
    }, {});

    this.tableName = tableName;
  }
  put(Item) {
    if (!Item.id) Item.id = uuid.v4();
    replaceEmpty(Item);
    return docClient
      .put({
        TableName: this.tableName,
        Item,
      })
      .promise()
      .then(() => this.get(Item.id));
  }

  [_normalizeFields](fields) {
    return fields.map(field => {
      if (~reserved.indexOf(field.toUpperCase())) field = `#${field}`;
      return field;
    });
  }

  scan() {
    return docClient
      .scan({
        TableName: this.tableName,
        ProjectionExpression: this.fields.join(', '),
        ExpressionAttributeNames: this.expressionAttributes,
      })
      .promise()
      .then(parseItem)
  }

  get(id) {
    return docClient
      .get({
        TableName: this.tableName,
        Key: { id },
        ProjectionExpression: this.fields.join(', '),
        ExpressionAttributeNames: this.expressionAttributes,
      })
      .promise()
      .then(parseItem);
  }

  buildQuery(id, indexName) {
    indexName = indexName || 'id';
    let query = {
      TableName: this.tableName,
      KeyConditionExpression: `${indexName} = :hkey`,
      ExpressionAttributeValues: {
        ':hkey': id,
      },
    };
    if (indexName !== 'id') query.IndexName = `${indexName}-index`;
    return query;
  }

  query(params) {
    return docClient.query(params)
      .promise()
      .then(parseItem);
  }

  findById(id, indexName) {
    let params = this.buildQuery(id, indexName);
    return this.query(params);
  }
}

function parseItem(response) {
  return response.Item || response.Items;
}

function replaceEmpty(obj) {
  if (obj === null) return;
  for (var prop in obj) {
    let val = obj[prop];
    if (Array.isArray(obj)) obj[prop] = val.filter(v => !isEmpty(v));
    else if (typeof val === 'object') replaceEmpty(val);
    else if (isEmpty(val)) delete obj[prop];
  }
  return obj;
}

function isEmpty(val) {
  return val === '' || val === null || typeof val === 'undefined';
}
