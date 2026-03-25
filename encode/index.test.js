'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('encode');
  let r;

  r = cmds.b64_encode.execute(p(['Hello World']));
  ok('b64_encode: Hello World', r.status === 'success' && r.payload === 'SGVsbG8gV29ybGQ=', r.payload);

  r = cmds.b64_encode.execute(p(['']));
  ok('b64_encode: empty string → success', r.status === 'success' && r.payload === '', r.payload);

  r = cmds.b64_encode.execute(p([undefined]));
  ok('b64_encode: undefined → error', r.status === 'error', r.payload);

  r = cmds.b64_decode.execute(p(['SGVsbG8gV29ybGQ=']));
  ok('b64_decode: SGVsbG8gV29ybGQ=', r.status === 'success' && r.payload === 'Hello World', r.payload);

  r = cmds.b64_decode.execute(p(['']));
  ok('b64_decode: empty → error', r.status === 'error', r.payload);

  r = cmds.b64_encode.execute(p(['こんにちは']));
  const unicodeEncoded = r.payload;
  r = cmds.b64_decode.execute(p([unicodeEncoded]));
  ok('b64: unicode roundtrip', r.status === 'success' && r.payload === 'こんにちは', r.payload);

  r = cmds.url_encode.execute(p(['hello world & more']));
  ok('url_encode', r.status === 'success' && r.payload === 'hello%20world%20%26%20more', r.payload);

  r = cmds.url_decode.execute(p(['hello%20world']));
  ok('url_decode', r.status === 'success' && r.payload === 'hello world', r.payload);

  r = cmds.url_decode.execute(p(['']));
  ok('url_decode: empty → error', r.status === 'error', r.payload);

  r = cmds.html_encode.execute(p(['<b>bold</b>']));
  ok('html_encode: tags', r.status === 'success' && r.payload === '&lt;b&gt;bold&lt;/b&gt;', r.payload);

  r = cmds.html_encode.execute(p(['AT&T']));
  ok('html_encode: ampersand', r.status === 'success' && r.payload === 'AT&amp;T', r.payload);

  r = cmds.html_decode.execute(p(['&lt;b&gt;bold&lt;/b&gt;']));
  ok('html_decode: tags', r.status === 'success' && r.payload === '<b>bold</b>', r.payload);

  r = cmds.html_decode.execute(p(['']));
  ok('html_decode: empty → error', r.status === 'error', r.payload);
};
