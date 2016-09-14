'use strict';

const _ = require('lodash');

const postgresPropTypes = {
  timestampWithTimezone: 'TIMESTAMP WITH TIME ZONE',
  boolean: 'BOOLEAN',
  text: 'TEXT',
  float8: 'float8',
  json: 'JSON',
};

function guessDocumentPropTypes(document) {
  return _.mapValues(
    document,
    value => {
      let result;
      const type = typeof value;

      switch (type) {
        case 'object':
          if (value === null) {
            result = postgresPropTypes.text;
          } else if (value instanceof Date) {
            result = postgresPropTypes.timestampWithTimezone;
          } else if (value.constructor.name === 'ObjectID') {
            result = postgresPropTypes.text;
          } else {
            result = postgresPropTypes.json;
          }
          break;
        case 'string':
          result = postgresPropTypes.text;
          break;
        case 'boolean':
          result = postgresPropTypes.boolean;
          break;
        case 'number':
          result = postgresPropTypes.float8;
          break;
        default:
          result = postgresPropTypes.text;
      }

      return result;
    }
  );
}

function resolveMultipleFieldTypes(fieldTypes) {
  return [
    {fieldTypes: [postgresPropTypes.float8, postgresPropTypes.text], resolveTo: postgresPropTypes.text},
    {fieldTypes: [postgresPropTypes.timestampWithTimezone, postgresPropTypes.text], resolveTo: postgresPropTypes.text},
    {fieldTypes: [postgresPropTypes.boolean, postgresPropTypes.text], resolveTo: postgresPropTypes.text},
  ].reduce(
    (result, caseConfig) => _.difference(fieldTypes, caseConfig.fieldTypes).length ? result : caseConfig.resolveTo,
    postgresPropTypes.text
  );
}

function fieldTypesByFieldNameReducer(carry, fieldTypes) {
  return _.reduce(
    fieldTypes,
    (carry, fieldType, fieldName) => {
      if (!carry[fieldName]) {
        carry[fieldName] = [fieldType];
      } else if (!~carry[fieldName].indexOf(fieldType)) {
        carry[fieldName].push(fieldType);
      }

      return carry;
    },
    carry
  );
}

function checkForMultipleFieldTypes(fieldTypes, fieldName) {
  if (fieldTypes.length > 1) {
    const resolved = resolveMultipleFieldTypes(fieldTypes);
    console.log(`  field ${fieldName} guessed:`, fieldTypes, 'resolved:', resolved);
    return resolved;
  }

  return fieldTypes[0];
}

module.exports = {
  guessCollectionFieldTypes: collection => _.mapValues(
    collection.map(guessDocumentPropTypes).reduce(fieldTypesByFieldNameReducer, {}),
    checkForMultipleFieldTypes
  ),
  mongoIdType: postgresPropTypes.text
};