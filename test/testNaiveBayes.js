/*
This test is designed to demonstrate that the Naive Bayes classifier produces
sane error rates. To run the test, save the 20 Newsgroup data from
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
        _.range(1,20+1).forEach(function (_class) {
          output[_class] = {};
        });
        data.forEach(function (docWordCount, index) {
          var doc = parseInt(docWordCount[0], 10);
          var word = parseInt(docWordCount[1], 10);
          var count = parseInt(docWordCount[2], 10);
          var _class = parseInt(labels[String(doc-1)][0], 10);
          if (!(doc in output[_class]))
            output[_class][doc] = {};
          output[_class][doc][word] = count;
        });
        output = _.mapValues(output, function (docs) {
          return _.values(docs);
        });
        resolve(output);
      });
    });
  });
  return promise;
}

function testNaiveBayes(trainingData, testingData) {
  var nb = new ml.classify.NaiveBayes(_.range(1,20+1).map(String), _.range(1,61188+1).map(String));
  var startTrain = _.now();
  nb.train(trainingData);
  console.log('Training took ' + String((_.now() - startTrain) / 1000) + ' seconds.');
  var startTest = _.now();
  var totalErrorRate = 0;
  _.forEach(testingData, function (data, _class) {
    nb.classifyInstances(data, function (classifications) {
      var errorRate = _.filter(classifications, function (c) {
        return c != _class;
      }).length / classifications.length;
      totalErrorRate += errorRate;
      console.log('Class ' + _class + ' had an error rate of ' + errorRate);
      console.log('Testing ' + _class + ' took ' + String((_.now() - startTest) / 1000) + ' seconds.');
    });
  });
  console.log('Mean error rate: ' + totalErrorRate / 20);
}

RSVP.all([process_data('train'), process_data('test')]).then(function (data) {
  testNaiveBayes(data[0], data[1]);
});