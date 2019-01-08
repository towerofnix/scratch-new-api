const tap = require('tap');
const CookieUtil = require('../src/util/cookie-util');

// Basic functionality
tap.match(CookieUtil.parse('a=b;c=d'), {a: 'b', c: 'd'});

// Trim key...
tap.match(CookieUtil.parse('a =b'), {a: 'b'});

// ...but not value
tap.match(CookieUtil.parse('a= b'), {a: ' b'});

// = in value
tap.match(CookieUtil.parse('a=b=c=d;x=='), {a: 'b=c=d', x: '='});
