const {partialRight} = require('ramda');
const stringify = partialRight(JSON.stringify, null, 2);

module.exports = {stringify};
