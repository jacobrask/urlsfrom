var async = require('async');
var http = require('http');
var request = require('request');
var Transform = require('stream').Transform;
var htmlparser = require("htmlparser2");

var URL_RE = new RegExp('((https?:\\/\\/)|(www.?\\.))'+ // protocol or www
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?', 'gi'); // query string

var getUrl = function (str) {
  var match = new RegExp(URL_RE).exec(str);
  if (match == null) return;
  match = match[0];
  // Prefix protocol-less matches
  if (!/^http/.test(match)) match = 'http://' + match;
  return match;
};

exports = module.exports = function (opts) {
  opts || (opts = {});
  var objectMode = !!opts.objectMode || !!opts.title;
  var urlStream = new Transform({ objectMode: objectMode });
  urlStream._transform = function (data, enc, done) {
    if (!objectMode) data = data.toString();
    var urls = data.split(' ').reduce(function (urls, str) {
      var url = getUrl(str);
      if (url) urls.push(url);
      return urls;
    }, []);

    if (opts.validate || opts.title) {
      async.forEach(urls, function (url, next) {
        var urlObj = objectMode ? { href: url } : url;
        var req;
        if (!opts.title) {
          req = request.head(url);
        } else {
          req = request.get(url);
          urlObj.title = '';
          var inTitle = false;
          // Parse but exit after title was found
          var parser = new htmlparser.WritableStream({
            onopentag: function (name) { if (name === 'title') inTitle = true; },
            ontext: function (text) { if (inTitle) urlObj.title += text; },
            onclosetag: function (name) {
              if (name === 'title') {
                inTitle = false;
                req.response.destroy();
              }
            }
          });
          req.pipe(parser);
        }
        // If any error occurred, assume it wasn't a valid URL
        req.on('error', function () { next(); });
        req.on('end', function () {
          if (req.response.statusCode == 200) urlStream.push(urlObj);
          next();
        });
      }, function (err) {
        done();
      });
    } else {
      urls.forEach(function (url) {
        if (objectMode) urlStream.push({ href: url });
        else urlStream.push(url);
      });
      done();
    }
  };
  return urlStream;
};
