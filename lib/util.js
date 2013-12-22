var _ = require('lodash');

function filledArray(rows, cols, val) {
  if (rows === 1) {
    var array = [];
    for (var i = 0; i < cols; i++)
      array[i] = val;
    return array;
  }
  return _.map(filledArray(1, rows, 0), function () {
    return filledArray(1, cols, val);
  });
}

// returns a two-dimensional array of of size rows by cols filled with zeros
function zeros(rows, cols) {
  return filledArray(rows, cols, 0);
}

// returns the sum of all the (Number) elements of array
function sum(array) {
  return _.reduce(array, function(sum, num) {
    return sum + num;
  });
}

// returns an object with elements of array as keys and all values set to 0
function mapToZeros(array) {
  var object = {};
  _.forEach(array, function (element) {
    object[element] = 0;
  });
  return object;
}

// returns the key in the object mapped to the largest value
function argmax(object) {
  var maxValue = null;
  var maxArg = null;
  _.forEach(object, function (value, key) {
    if (maxValue === null || value > maxValue) {
      maxValue = value;
      maxArg = key;
    }
  });
  return maxArg;
}

var DOUBLE_EPSILON = 0.000001;
function sign(num) {
  if (Math.abs(num) < DOUBLE_EPSILON)
    return 0;
  return num > 0 ? 1 : -1;
}

module.exports = {
  zeros: zeros,
  sum: sum,
  mapToZeros: mapToZeros,
  argmax: argmax,
  sign: sign
};