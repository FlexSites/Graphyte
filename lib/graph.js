'use strict';

const { get } = require('object-path');

const makeExecutableSchema = require('./parse-schema').makeExecutableSchema;

module.exports = (schemaList) => {
  var schemas = schemaList.reduce((results, schemata) => {
    if (schemata.name === 'Initial') {
      results.initial = schemata;
      return results;
    }
    if (schemata.definition) results.types.push(`${schemata.type || 'type'} ${schemata.type === 'schema' ? '' : schemata.name} { ${schemata.definition} }`);
    if (schemata.resolve) {
      // let resolve = parseResolve(schemata.resolve);
      // results.resolves.push({ [schemata.name]: resolve });
      // results.resolves.push(resolve);
      results.resolves.push(schemata.resolve);
    }
    if (schemata.mock) results.mocks.push(schemata.mock);
    return results;
  }, { types: [], resolves: [], mocks: [], initial: {} });


  schemas.resolves = Object.assign({}, ...schemas.resolves);

  return makeExecutableSchema({
    typeDefs: schemas.types,
    resolvers: parseResolve(schemas.resolves),
  });
}

function parseResolve(resolve) {
  return Object.keys(resolve)
    .reduce((prev, curr) => {
      let val = resolve[curr];
      if (typeof val === 'string') {
        prev[curr] = (source, params, context, info) => {
          try {
            let conn = context.tenant.connection('mongodb');
            return (new Function('source', 'params', 'db', 'user', 'fields', val)).apply(null, [source, params, conn.table.bind(conn), context.user, getProjection(info)])
          } catch (ex) {
            console.error('holy shit', ex);
          }
          return null;
        }
      } else if (typeof val === 'object') prev[curr] = parseResolve(val);

      // if (typeof prev[curr] === 'function') prev[curr]({ id: 'seth' }, { id: 'notseth' }, { info: 'seth' });
      return prev;
    }, {});
}

function getProjection(info) {
  return get(info, ['fieldASTs', 0, 'selectionSet', 'selections'], [])
    .map((selection) => get(selection, ['name', 'value']))
}
