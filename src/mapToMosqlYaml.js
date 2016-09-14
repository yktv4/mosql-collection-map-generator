'use strict';

const yaml = require('js-yaml');
const _ = require('lodash');
const mongoIdType = require('./guessCollectionFieldTypes').mongoIdType;
const fs = require('file-system');

const excludeFilePath = './../exclude.json';
let excludeConfig = {fields: [], collections: []};
try {
  fs.accessSync(excludeFilePath, fs.F_OK);
  excludeConfig = require(excludeFilePath);
} catch (err) {
  //do nothing, just prevent err
}

function fieldExcluded(collectionName, fieldName) {
  const fieldExcluded = ~excludeConfig.fields.indexOf(fieldName);
  const fieldExcludedWithinCollection = ~excludeConfig.fields.indexOf(`${collectionName}.${fieldName}`);

  return fieldExcluded || fieldExcludedWithinCollection;
}

function collectionExcluded(name) {
  return ~excludeConfig.collections.indexOf(name);
}

module.exports = (dbName, collections) => {
  const result = {
    [dbName]: collections.reduce(
      (carry, collection) => {
        if (!collectionExcluded(collection.name)) {
          carry[collection.name] = {
            ':columns': _.map(collection.fieldTypes, (fieldType, fieldName) => {
              if (fieldExcluded(collection.name, fieldName)) {
                console.log(`ignoring field: ${collection.name}.${fieldName}`);
                return null;
              }

              return fieldName === '_id'
                ? {id: {':source': '_id', ':type': mongoIdType}}
                : {[fieldName]: fieldType};
            }).filter(field => field !== null),
            ':meta': {
              ':table': collection.name,
              ':extra_props': true
            },
          };
        }

        return carry;
      },
      {}
    )
  };

  return yaml.safeDump(result, {noCompatMode: true});
};