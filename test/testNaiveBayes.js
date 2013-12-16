var ml = require('ml-kit')
  , csv = ml.process.csv
  , _ = require('lodash')
  , fs = require('fs');

// download 20 Newsgroups data from http://qwone.com/~jason/20Newsgroups/20news-bydate-matlab.tgz

function process_data(name) {
  csv().from.path('./' + name + '.label').to.array(function (labels) {
    csv().from.path('./' + name + '.data', { delimiter: ' ' }).to.array(function (data) {
      var output = {};
      _.forEach(_.range(1,20+1), function (_class) {
        output[_class] = {};
      });
      _.forEach(data, function (docWordCount, index) {
        var doc = _.parseInt(docWordCount[0], 10);
        var word = _.parseInt(docWordCount[1], 10);
        var count = _.parseInt(docWordCount[2], 10);
        var _class = _.parseInt(labels[String(doc-1)][0], 10);
        if (!(doc in output[_class]))
          output[_class][doc] = {};
        output[_class][doc][word] = count;
      });
      output = _.mapValues(output, function (docs) {
        return _.values(docs);
      });
      fs.writeFile('./' + name + '.json', JSON.stringify(output, null, '\t'), function (err) {
        if (err) console.error(err);
        else console.log(name + ' data saved');
      });
    });
  });
}

function testNaiveBayes() {
  var nb = new ml.classify.NaiveBayes(_.map(_.range(1,20+1), String), _.map(_.range(1,61188+1), String));
  var trainingData = require('./train.json');
  var testingData = require('./test.json');
  var startTrain = _.now();
  nb.train(trainingData);
  console.log('Training took ' + String((_.now() - startTrain) / 1000) + ' seconds.');
  var startTest = _.now();
  var totalErrorRate = 0;
  _.forEach(testingData, function (data, _class) {
    nb.classifyInstances(data, function (classifications) {
      //fs.writeFileSync('tmp-' + _class + '.label', classifications.join('\n'));
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


process_data('train');
process_data('test');
testNaiveBayes();