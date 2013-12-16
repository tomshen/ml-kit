var _ = require('lodash')
  , util = require('./util.js');

function Classifier() {
}

function NaiveBayes(classes, features) {
  Classifier.call(this);
  this.classes = classes.slice();
  this.features = features.slice();
  this.classCounts = util.mapToZeros(classes);
  this.featureCounts = {};
  _.forEach(classes, function (_class) {
    this.featureCounts[_class] = util.mapToZeros(features);
  }, this);
  this.totalClassCount = 0;
  this.totalFeatureCount = util.mapToZeros(classes);
}
NaiveBayes.prototype = Object.create(Classifier.prototype);
NaiveBayes.prototype.constructor = NaiveBayes;

NaiveBayes.prototype.train = function (trainingData) {
  var isArray = null;
  var nb = {}
  _.forEach(trainingData, function (instances, _class) {
    if (isArray === null)
      isArray = instances[0] instanceof Array;
    _.forEach(instances, function (instance) {
      this.classCounts[_class]++;
      this.totalClassCount++;
      _.forEach(instance, function (count, feature) {
        if (isArray)
          count = 1;
        this.featureCounts[_class][feature] += count;
        this.totalFeatureCount[_class] += count;
      }, this);
    }, this);
  }, this);
};

NaiveBayes.prototype.classifyInstance = function (instance) {
  var numClasses = this.classes.length;
  var numFeatures = _.keys(instance).length;
  var isArray = instance instanceof Array;
  return util.argmax(_.zipObject(this.classes, _.map(this.classes, function (_class) {
    var logClassPrior = Math.log(this.classCounts[_class] / this.totalClassCount);
    var logProbInstanceGivenClass = util.sum(_.map(instance, function (count, feature) {
      var numGivenClassGivenFeature = this.featureCounts[_class][feature];
      var numGivenClassAnyFeature = this.totalFeatureCount[_class];
      var smoothedLogProb = Math.log((numGivenClassGivenFeature + 1) / (numGivenClassAnyFeature + numFeatures));
      return isArray ? smoothedLogProb : count * smoothedLogProb;
    }, this));
    return logProbInstanceGivenClass + logClassPrior;
  }, this)));
}

NaiveBayes.prototype.encodeClassifier = function () {
  return {
    classes: this.classes,
    features: this.features,
    classCounts: this.classCounts,
    featureCounts: this.featureCounts,
    totalClassCount: this.totalClassCount,
    featureCounts: this.totalFeatureCount
  };
}

NaiveBayes.prototype.classifyInstances = function (instances, callback) {
  return callback(_.map(instances, function (instance) {
    return this.classifyInstance(instance);
  }, this));
}

module.exports = {
  NaiveBayes: NaiveBayes
}