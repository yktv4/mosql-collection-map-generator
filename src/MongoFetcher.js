'use strict';

const Promise = require('bluebird');

class MongoFetcher {
  constructor(db) {
    this.db = db;
  }

  fetchCollectionNames() {
    return this.db.listCollections().toArray().then(collections => collections.map(collection => collection.name));
  }

  fetchCollection(name) {
    //limit number of documents to any sufficient integer that represents all field types
    //to avoid running out of memory due to large collections
    return this.db.collection(name).find({}, {limit: 5000}).toArray();
  }
}

module.exports = MongoFetcher;