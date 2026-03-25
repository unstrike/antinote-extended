'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('http_tools');
  let r;

  // http_status
  r = cmds.http_status.execute(p([200]));
  ok('http_status: 200 OK', r.status === 'success' && r.payload === '200 OK  [2xx Success]', r.payload);

  r = cmds.http_status.execute(p([404]));
  ok('http_status: 404 Not Found', r.status === 'success' && r.payload === '404 Not Found  [4xx Client Error]', r.payload);

  r = cmds.http_status.execute(p([301]));
  ok('http_status: 301 Moved Permanently', r.status === 'success' && r.payload.includes('301') && r.payload.includes('3xx'), r.payload);

  r = cmds.http_status.execute(p([500]));
  ok('http_status: 500 Internal Server Error', r.status === 'success' && r.payload.includes('5xx'), r.payload);

  r = cmds.http_status.execute(p([418]));
  ok("http_status: 418 I'm a Teapot", r.status === 'success' && r.payload.includes('418'), r.payload);

  r = cmds.http_status.execute(p([999]));
  ok('http_status: unknown code → error', r.status === 'error', null);

  // mime_type
  r = cmds.mime_type.execute(p(['json']));
  ok('mime_type: json', r.status === 'success' && r.payload === 'application/json', r.payload);

  r = cmds.mime_type.execute(p(['png']));
  ok('mime_type: png', r.status === 'success' && r.payload === 'image/png', r.payload);

  r = cmds.mime_type.execute(p(['mp4']));
  ok('mime_type: mp4', r.status === 'success' && r.payload === 'video/mp4', r.payload);

  r = cmds.mime_type.execute(p(['woff2']));
  ok('mime_type: woff2', r.status === 'success' && r.payload === 'font/woff2', r.payload);

  r = cmds.mime_type.execute(p(['html']));
  ok('mime_type: html', r.status === 'success' && r.payload === 'text/html', r.payload);

  r = cmds.mime_type.execute(p(['unknownext']));
  ok('mime_type: unknown extension → error', r.status === 'error', null);
};
