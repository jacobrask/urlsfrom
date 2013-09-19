var async = require('async');
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

var urlsFrom = function (str, opts, save, done) {
  var objectMode = !!opts.objectMode || !!opts.title;

  var urls = str.split(' ').reduce(function (urls, str) {
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
        if (req.response.statusCode == 200) save.push(urlObj);
        next();
      });
    },
    function () { done(); }
    );
  } else {
    urls.forEach(function (url) {
      if (objectMode) save.push({ href: url });
      else save.push(url);
    });
    done();
  }
};

var asyncParser = function (str, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = null;
  }
  opts || (opts = {});
  var urls = [];
  urlsFrom(str, opts, urls, function () { cb(null, urls); });
};

var urlStream = function (opts) {
  opts || (opts = {});
  opts.objectMode = opts.objectMode != null ? opts.objectMode : !!opts.title;
  var urlStream = new Transform({ objectMode: opts.objectMode });
  urlStream._transform = function (data, enc, done) {
    if (!opts.objectMode) data = data.toString();
    urlsFrom(data, opts, urlStream, done);
  };
  return urlStream;
};

asyncParser.stream = urlStream;

exports = module.exports = asyncParser;
