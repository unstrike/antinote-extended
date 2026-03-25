'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('crypto_tools');
  let r;

  // uuid_gen
  r = cmds.uuid_gen.execute(p([]));
  ok('uuid_gen: success', r.status === 'success', r.payload);
  ok('uuid_gen: 36 chars', r.payload && r.payload.length === 36, r.payload && r.payload.length);
  ok('uuid_gen: UUID format', r.payload && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(r.payload), r.payload);

  const u1 = cmds.uuid_gen.execute(p([])).payload;
  const u2 = cmds.uuid_gen.execute(p([])).payload;
  ok('uuid_gen: different each time', u1 !== u2, null);

  // rand_hex
  r = cmds.rand_hex.execute(p([16]));
  ok('rand_hex: 16 bytes = 32 hex chars', r.status === 'success' && r.payload.length === 32, r.payload && r.payload.length);
  ok('rand_hex: hex chars only', /^[0-9a-f]+$/i.test(r.payload), r.payload);

  r = cmds.rand_hex.execute(p([0]));
  ok('rand_hex: 0 bytes → error', r.status === 'error', null);

  r = cmds.rand_hex.execute(p([1025]));
  ok('rand_hex: >1024 → error', r.status === 'error', null);

  // rand_b64
  r = cmds.rand_b64.execute(p([16]));
  ok('rand_b64: success', r.status === 'success', r.payload);
  ok('rand_b64: non-empty result', r.payload && r.payload.length > 0, null);

  r = cmds.rand_b64.execute(p([0]));
  ok('rand_b64: 0 bytes → error', r.status === 'error', null);

  // password_gen
  r = cmds.password_gen.execute(p([16]));
  ok('password_gen: 16 chars', r.status === 'success' && r.payload.length === 16, r.payload && r.payload.length);

  r = cmds.password_gen.execute(p([16, 'hex']));
  ok('password_gen: hex charset', r.status === 'success' && r.payload.length === 16 && /^[0-9a-f]+$/.test(r.payload), r.payload);

  r = cmds.password_gen.execute(p([16, 'alpha']));
  ok('password_gen: alpha charset', r.status === 'success' && /^[a-zA-Z]+$/.test(r.payload), r.payload);

  r = cmds.password_gen.execute(p([0]));
  ok('password_gen: length 0 → error', r.status === 'error', null);

  r = cmds.password_gen.execute(p([513]));
  ok('password_gen: length >512 → error', r.status === 'error', null);
};
