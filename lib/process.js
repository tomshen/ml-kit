var csv = require('csv')
  , _ = require('lodash');

function Instance(features, actualClass) {
  if (typeof actualClass === 'undefined')
    this.actualClass = null;
  else
    this.actualClass = actualClass;
  if (features instanceof Array) {
    // we assume each element indicates the prescence of that feature
    this.features = {};
    _.forEach(features, function (feature) {
      this.features[feature] = 1;
    }, this);
  } else {
    this.features = _.clone(features);
  }
}

Instance.prototype.getClass = function () {
  return this.actualClass;
}

Instance.prototype.getFeatureVector = function () {
  return this.features;
}

module.exports = {
  csv: csv,
  Instance: Instance
}