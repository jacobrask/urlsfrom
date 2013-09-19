var test = require('tap').test;
var urlsFrom = require('../').stream;

test('Get URLs', function (t) {
  t.plan(1);
  
  var urlStream = urlsFrom();
  urlStream.on('data', function (url) {
    t.equal(url.toString(), 'http://example.com');
  });
  urlStream.write('Lorem ipsum http://example.com');
  urlStream.end();
});

test('Get URL objects', function (t) {
  t.plan(1);
  
  var urlStream = urlsFrom({ objectMode: true });
  urlStream.on('data', function (url) {
    t.equal(url.href, 'http://example.com');
  });
  urlStream.write('Lorem ipsum http://example.com');
  urlStream.end();
});

test('Get validated URLs', function (t) {
  t.plan(1);
  
  var urlStream = urlsFrom({ validate: true });
  urlStream.on('data', function (url) {
    t.equal(url.toString(), 'http://example.com');
  });
  urlStream.write('Lorem ipsum http://example.com');
  urlStream.end();
});

