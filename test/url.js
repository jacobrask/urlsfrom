var test = require('tap').test;
var urlsFrom = require('../');

test('Get URLs', function (t) {
  t.plan(1);
  
  var str = 'Lorem ipsum http://example.com';
  urlsFrom(str, function (err, urls) {
    t.equal(urls[0], 'http://example.com');
  });
});
