'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('jwt');
  let r;

  // exp=1916239022 (~year 2030, definitely valid)
  const FUTURE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxOTE2MjM5MDIyfQ.sig'; // gitleaks:allow
  // exp=0 (Unix epoch 1970, definitely expired)
  const EXPIRED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjowfQ.sig'; // gitleaks:allow
  // no exp claim
  const NO_EXP_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig'; // gitleaks:allow

  // jwt_decode
  r = cmds.jwt_decode.execute(p([FUTURE_TOKEN]));
  ok('jwt_decode: success', r.status === 'success', r.payload);
  ok('jwt_decode: contains header section', r.payload && r.payload.includes('Header'), r.payload);
  ok('jwt_decode: contains payload section', r.payload && r.payload.includes('Payload'), r.payload);
  ok('jwt_decode: contains expiry section', r.payload && r.payload.includes('Expiry'), r.payload);
  ok('jwt_decode: valid token shows future expiry', r.payload && r.payload.includes('valid for'), r.payload);

  r = cmds.jwt_decode.execute(p([EXPIRED_TOKEN]));
  ok('jwt_decode: expired token', r.status === 'success' && r.payload.includes('EXPIRED'), r.payload);

  r = cmds.jwt_decode.execute(p([NO_EXP_TOKEN]));
  ok('jwt_decode: no exp → no expiry section', r.status === 'success' && !r.payload.includes('Expiry'), r.payload);

  r = cmds.jwt_decode.execute(p(['']));
  ok('jwt_decode: empty → error', r.status === 'error', null);

  r = cmds.jwt_decode.execute(p(['not.a.token']));
  ok('jwt_decode: invalid token → error', r.status === 'error', null);

  // jwt_exp
  r = cmds.jwt_exp.execute(p([FUTURE_TOKEN]));
  ok('jwt_exp: future token shows valid', r.status === 'success' && r.payload.includes('valid for'), r.payload);

  r = cmds.jwt_exp.execute(p([EXPIRED_TOKEN]));
  ok('jwt_exp: expired token shows EXPIRED', r.status === 'success' && r.payload.includes('EXPIRED'), r.payload);

  r = cmds.jwt_exp.execute(p([NO_EXP_TOKEN]));
  ok('jwt_exp: no exp → success with no exp message', r.status === 'success' && r.payload.includes('No exp claim'), r.payload);

  r = cmds.jwt_exp.execute(p(['']));
  ok('jwt_exp: empty → error', r.status === 'error', null);
};
