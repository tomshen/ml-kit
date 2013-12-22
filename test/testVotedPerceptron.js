/*
This test is designed to demonstrate that the Voted Perceptron classifier
produces sane error rates. To run the test, save the 20 Newsgroup data from
[http://qwone.com/~jason/20Newsgroups/20news-bydate-matlab.tgz] to
test/data, and run the file.
*/

var ml = require('../lib/ml-kit')
  , csv = ml.process.csv
  , _ = require('lodash')
  , fs = require('fs')
  , RSVP = require('rsvp');

function process_data(name) {
  var promise = new RSVP.Promise(function (resolve, reject) {
    csv().from.path('./data/' + name + '.label').to.array(function (labels) {
      csv().from.path('./data/' + name + '.data', { delimiter: ' ' }).to.array(function (data) {
        var output = {};
        var features = {};
        [1,2].forEach(function (_class) {
          output[_class] = {};
        });
        data.forEach(function (docWordCount, index) {
          var doc = parseInt(docWordCount[0], 10);
          var word = parseInt(docWordCount[1], 10);
          var count = parseInt(docWordCount[2], 10);
          var _class = parseInt(labels[String(doc-1)][0], 10);
          if (_class > 2 || _.keys(output[_class]).length > 200)
            return;
          if (!(doc in output[_class]))
            output[_class][doc] = {};
          output[_class][doc][word] = count;
          features[String(word)] = 1;
        });
        var instances = [];
        _.forEach(output, function (featureVectors, _class) {
          _.forEach(featureVectors, function (featureVector) {
            instances.push(new ml.process.Instance(featureVector, _class));
          });
        });
        resolve({data: instances, features: _.keys(features)});
      });
    });
  });
  return promise;
}

function testVotedPerceptron(trainingData, testingData, features) {
  var vp = new ml.classify.VotedPerceptron(['1','2'], features);
  var startTrain = _.now();
  vp.train(trainingData);
  console.log('Training took ' + String((_.now() - startTrain) / 1000) + ' seconds.');
  var startTest = _.now();
  vp.classifyInstances(testingData, function (classifications) {
    var errorRate = _.filter(classifications, function (c, i) {
      return c != trainingData[i].getClass();
    }).length / classifications.length;
    console.log('Error rate: ' + String(errorRate));
    console.log('Testing took ' + String((_.now() - startTest) / 1000) + ' seconds.');
  });
}

RSVP.all([process_data('train'), process_data('test')]).then(function (data) {
  testVotedPerceptron(data[0].data, data[1].data, _.intersection(data[0].features, data[1].features));
}).fail(function (error) { console.log(error.stack); });