# urlsfrom


# example

``` js
var urlStream = require('urlsfrom')({ validate: true, title: true });
urlStream.on('data', function (url) {
  // url = { href: 'http://example.com', ContentType: 'text/html', title: 'Example Domain' }
});
urlStream.write('Lorem ipsum http://example.com');
urlStream.end();
```
