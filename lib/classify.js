var _ = require('lodash')
  , util = require('./util.js');

function Classifier(classes, features) {
  this.classes = classes.slice();
  this.features = features.slice();
}

Classifier.prototype.classifyInstances = function (instances, callback) {
  return callback(_.map(instances, function (instance) {
    return this.classifyInstance(instance);
  }, this));
};

function NaiveBayes(classes, features) {
  Classifier.apply(this, arguments);
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
  _.forEach(trainingData, function (instances, _class) {
    if (isArray === null)
      isArray = instances[0] instanceof Array;
    instances.forEach(function (instance) {
      this.classCounts[_class]++;
      this.totalClassCount++;
      _.forEach(instance, function (weight, feature) {
        if (isArray)
          weight = 1;
        this.featureCounts[_class][feature] += weight;
        this.totalFeatureCount[_class] += weight;
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
    var logProbInstanceGivenClass = util.sum(_.map(instance, function (weight, feature) {
      var numGivenClassGivenFeature = this.featureCounts[_class][feature];
      var numGivenClassAnyFeature = this.totalFeatureCount[_class];
      var smoothedLogProb = Math.log((numGivenClassGivenFeature + 1) / (numGivenClassAnyFeature + numFeatures));
      return isArray ? smoothedLogProb : weight * smoothedLogProb;
    }, this));
    return logProbInstanceGivenClass + logClassPrior;
  }, this)));
};

NaiveBayes.prototype.encodeClassifier = function () {
  return {
    classes: this.classes,
    features: this.features,
    classCounts: this.classCounts,
    featureCounts: this.featureCounts,
    totalClassCount: this.totalClassCount,
    totalFeatureCount: this.totalFeatureCount
  };
};

/*
Voted perceptron algorithm based on pseudocode from
[http://curtis.ml.cmu.edu/w/courses/index.php/Voted_Perceptron].

Note that because this algorithm is not parallelizable, it's very slow
for large data sets.
*/
function VotedPerceptron(classes, features, maxIterations) {
  Classifier.apply(this, arguments);
  if (this.classes.length !== 2)
    throw new Error('Voted Perceptron is a binary classifier: the number of classes must be 2.');
  if (typeof maxIterations !== 'number')
    this.maxIterations = 3;
  else
    this.maxIterations = maxIterations;
  this.perceptrons = [{ vector: {}, weight: 0 }];
  _.forEach(this.features, function (feature) {
    this.perceptrons[0].vector[feature] = 0;
  }, this);
}
VotedPerceptron.prototype = Object.create(Classifier.prototype);
VotedPerceptron.prototype.constructor = VotedPerceptron;

VotedPerceptron.prototype.train = function (trainingData) {
  var iterations = 0;
  while (iterations < this.maxIterations) {
    _.forEach(_.shuffle(trainingData), function (instance) {
      var predictedClass = this.classifyInstance(instance);
      var featureVector = instance.getFeatureVector(),
          actualClass = instance.getClass();
      if (predictedClass === actualClass) {
        this.perceptrons[this.perceptrons.length-1].weight += 1;
      } else {
        this.perceptrons.push({
          vector: _.mapValues(this.perceptrons[this.perceptrons.length-1].vector, function (weight, feature) {
            if (!(feature in featureVector))
              return weight;
            var actualClassLabel = 1;
            if (this.classes[0] === actualClass)
              actualClassLabel = -1;
            return weight + actualClassLabel * featureVector[feature];
          }, this),
          weight: 1
        });
      }
    }, this);
    iterations++;
  }
};

VotedPerceptron.prototype.classifyInstance = function (instance) {
  var featureVector = instance.getFeatureVector();
  var out = util.sum(_.map(this.perceptrons, function (perceptron) {
    return perceptron.weight * util.sign(util.sum(_.map(featureVector,
      function (weight, feature) {
        if (!(feature in perceptron.vector))
          return 0;
        return perceptron.vector[feature] * weight;
      }, this)));
  }, this));
  var s = util.sign(out);
  return s === 0 ? null : s > 0 ? this.classes[1] : this.classes[0];
};

module.exports = {
  NaiveBayes: NaiveBayes,
  VotedPerceptron: VotedPerceptron
};