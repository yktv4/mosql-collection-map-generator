'use strict';

const Promise = require('bluebird');
const fs = require('file-system');
Promise.promisifyAll(fs);

module.exports = (yamlString, fileName) => fs.writeFileAsync(fileName, yamlString);