'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('qr');
  let r;

  r = cmds.qr_url.execute(p(['Hello World']));
  ok('qr_url: success', r.status === 'success', r.payload);
  ok('qr_url: contains qrserver.com', r.payload && r.payload.includes('qrserver.com'), r.payload);
  ok('qr_url: default 300px', r.payload && r.payload.includes('300x300'), r.payload);

  r = cmds.qr_url.execute(p(['https://example.com', 500]));
  ok('qr_url: custom 500px size', r.status === 'success' && r.payload.includes('500x500'), r.payload);

  r = cmds.qr_url.execute(p(['test', 2000]));
  ok('qr_url: size clamped to 1000', r.status === 'success' && r.payload.includes('1000x1000'), r.payload);

  r = cmds.qr_url.execute(p(['test', 10]));
  ok('qr_url: size clamped min to 50', r.status === 'success' && r.payload.includes('50x50'), r.payload);

  r = cmds.qr_url.execute(p(['']));
  ok('qr_url: empty text → error', r.status === 'error', null);

  r = cmds.qr.execute(p(['Hello World']));
  ok('qr: success with URL', r.status === 'success' && r.payload.includes('qrserver.com'), r.payload);

  r = cmds.qr.execute(p(['']));
  ok('qr: empty → error', r.status === 'error', null);
};
