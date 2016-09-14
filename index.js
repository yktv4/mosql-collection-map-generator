'use strict';

const MongoClient = require('mongodb').MongoClient;
const Promise = require('bluebird');

const MongoFetcher = require('./src/MongoFetcher');
const guessCollectionFieldTypes = require('./src/guessCollectionFieldTypes').guessCollectionFieldTypes;
const mapToMosqlYaml = require('./src/mapToMosqlYaml');
const output = require('./src/output');

MongoClient.connect(process.env.MONGO_URI).then(db => {
  const mongoFetcher = new MongoFetcher(db);

  function processCollection(name) {
    console.log('guessing fieldTypes for collection', name);

    return mongoFetcher.fetchCollection(name)
      .then(guessCollectionFieldTypes)
      .then(fieldTypes => ({name, fieldTypes}));
  }

  mongoFetcher.fetchCollectionNames()
    .then(names => Promise.map(names, processCollection, {concurrency: 3}))
    .then(collectionFieldTypes => mapToMosqlYaml(process.env.POSTGRES_DB_NAME, collectionFieldTypes))
    .then(yamlString => output(yamlString, 'mapping.yaml'))
    .then(() => db.close())
    .catch(err => {throw err});
});