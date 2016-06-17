'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3({ region: 'us-west-2' });
const { get } = require('object-path');
const request = require('request-promise');

const makeExecutableSchema = require('./parse-schema').makeExecutableSchema;

module.exports = (schemaList) => {
  if (!schemaList) return false;
  var schemas = schemaList.reduce((results, schemata) => {
    if (schemata.definition) results.typeDefs.push(`${schemata.type || 'type'} ${schemata.type === 'schema' ? '' : schemata.name} { ${schemata.definition} }`);
    if (schemata.resolve) {
      let resolve = parseResolve(schemata.resolve);
      // results.resolvers.push({ [schemata.name]: resolve });
      results.resolvers.push(resolve);
      // results.resolvers.push(schemata.resolve);
    }
    if (schemata.mock) results.mocks.push(schemata.mock);
    return results;
  }, { typeDefs: [], resolvers: [], mocks: [] });


  schemas.resolvers = Object.assign({}, ...schemas.resolvers);

  console.log(schemas);

  return makeExecutableSchema(schemas);
}

function parseResolve(resolve) {
  return Object.keys(resolve)
    .reduce((prev, curr) => {
      let val = resolve[curr];
      if (typeof val === 'string') {
        prev[curr] = (source, params, context, info) => {
          try {
            let conn = context.tenant.connection('mongodb');
            return (new Function('source', 'params', 'request', 'db', 'user', 'fields', val)).apply(null, [source, params, request, conn.table.bind(conn), context.user, getProjection(info)])
          } catch(ex) {
            console.error('holy shit', ex);
          }
        }
      }
      else if (typeof val === 'object') prev[curr] = parseResolve(val);
      // if (typeof prev[curr] === 'function') prev[curr]({ id: 'seth' }, { id: 'notseth' }, { info: 'seth' });
      return prev;
    }, {});
}

function getProjection(info) {
  return get(info, ['fieldASTs', 0, 'selectionSet', 'selections'], [])
    .map((selection) => get(selection, ['name', 'value']))
}
