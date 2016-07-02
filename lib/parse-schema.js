'use strict';

// Generates a schema for graphql-js given a shorthand schema

// TODO: document each function clearly in the code: what arguments it accepts
// and what it outputs.

const { parse } = require('graphql/language');
const { buildASTSchema } = require('graphql/utilities');
const { GraphQLSchema } = require('graphql/type');

// type definitions can be a string or an array of strings.
function makeExecutableSchema({
  typeDefs: typeDefinitions,
  resolvers: resolveFunctions,
}) {
  console.log('called make execute');
  if (!typeDefinitions) {
    throw new Error('Must provide typeDefinitions');
  }
  if (!resolveFunctions) {
    throw new Error('Must provide resolveFunctions');
  }

  // TODO: check that typeDefinitions is either string or array of strings

  let schema = buildASTSchema(
    parse(
      typeDefinitions
        .map(def => def.trim())
        .join('\n')
    )
  );


  addResolveFunctionsToSchema(schema, resolveFunctions);
  console.log('returning execute schema', schema instanceof GraphQLSchema);
  return schema;
}

function addResolveFunctionsToSchema(schema, resolveFunctions) {
  Object.keys(resolveFunctions).forEach((typeName) => {
    const type = schema.getType(typeName);
    if (!type && typeName !== '__schema') {
      throw new Error(
        `"${typeName}" defined in resolvers, but not in schema`
      );
    }

    Object.keys(resolveFunctions[typeName]).forEach((fieldName) => {
      if (fieldName.startsWith('__')) {
        // this is for isTypeOf and resolveType and all the other stuff.
        // TODO require resolveType for unions and interfaces.
        type[fieldName.substring(2)] = resolveFunctions[typeName][fieldName];
        return;
      }

      if (!type.getFields()[fieldName]) {
        throw new Error(
          `${typeName}.${fieldName} defined in resolvers, but not in schema`
        );
      }
      const field = type.getFields()[fieldName];
      const fieldResolve = resolveFunctions[typeName][fieldName];
      if (typeof fieldResolve === 'function') {
        // for convenience. Allows shorter syntax in resolver definition file
        setFieldProperties(field, { resolve: fieldResolve });
      } else {
        console.log(typeof fieldResolve, fieldResolve);
        if (typeof fieldResolve !== 'object') {
          throw new Error(`Resolver ${typeName}.${fieldName} must be object or function`);
        }
        setFieldProperties(field, fieldResolve);
      }
    });
  });
}

function setFieldProperties(field, propertiesObj) {
  Object.keys(propertiesObj).forEach((propertyName) => {
    // eslint-disable-next-line no-param-reassign
    field[propertyName] = propertiesObj[propertyName];
  });
}

module.exports = {
  makeExecutableSchema,
  addResolveFunctionsToSchema,
};

console.log('end of parse schema');
