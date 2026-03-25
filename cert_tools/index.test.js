'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('cert_tools');
  let r;

  // No valid PEM available — test error handling only
  r = cmds.cert_decode.execute(p([], ''));
  ok('cert_decode: empty note → error', r.status === 'error' && r.message.includes('No PEM certificate'), r.message);

  r = cmds.cert_decode.execute(p([], 'just some text without a certificate'));
  ok('cert_decode: no PEM block → error', r.status === 'error', null);

  r = cmds.cert_days.execute(p([], ''));
  ok('cert_days: empty note → error', r.status === 'error' && r.message.includes('No PEM certificate'), r.message);

  r = cmds.cert_days.execute(p([], 'not a certificate'));
  ok('cert_days: no PEM block → error', r.status === 'error', null);
};
