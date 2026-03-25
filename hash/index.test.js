'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('hash');
  let r;

  r = cmds.hash_md5.execute(p(['hello']));
  ok('hash_md5: hello', r.status === 'success' && r.payload === '5d41402abc4b2a76b9719d911017c592', r.payload);

  r = cmds.hash_md5.execute(p(['Hello World']));
  ok('hash_md5: Hello World', r.status === 'success' && r.payload === 'b10a8db164e0754105b7a99be72e3fe5', r.payload);

  r = cmds.hash_sha1.execute(p(['hello']));
  ok('hash_sha1: hello', r.status === 'success' && r.payload === 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d', r.payload);

  r = cmds.hash_sha256.execute(p(['hello']));
  ok('hash_sha256: hello', r.status === 'success' && r.payload === '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', r.payload);

  r = cmds.hash_sha512.execute(p(['hello']));
  ok('hash_sha512: 128-char hex', r.status === 'success' && r.payload.length === 128 && /^[0-9a-f]+$/.test(r.payload), r.payload?.length);

  r = cmds.hash_crc32.execute(p(['hello']));
  ok('hash_crc32: 8-char hex', r.status === 'success' && r.payload.length === 8 && /^[0-9A-F]+$/.test(r.payload), r.payload);

  r = cmds.hash_fnv1a.execute(p(['hello']));
  ok('hash_fnv1a: 8-char hex', r.status === 'success' && r.payload.length === 8 && /^[0-9A-F]+$/.test(r.payload), r.payload);

  r = cmds.hash_djb2.execute(p(['hello']));
  ok('hash_djb2: 8-char hex', r.status === 'success' && r.payload.length === 8 && /^[0-9A-F]+$/.test(r.payload), r.payload);

  r = cmds.hash_adler32.execute(p(['hello']));
  ok('hash_adler32: 8-char hex', r.status === 'success' && r.payload.length === 8 && /^[0-9A-F]+$/.test(r.payload), r.payload);

  r = cmds.hash_all.execute(p(['hello']));
  ok('hash_all: 8 lines', r.status === 'success' && r.payload.split('\n').length === 8, r.payload?.split('\n').length);
  ok('hash_all: contains md5', r.payload && r.payload.includes('5d41402abc4b2a76b9719d911017c592'), null);

  r = cmds.hash_md5.execute(p([undefined]));
  ok('hash_md5: undefined → error', r.status === 'error', r.payload);

  const h1 = cmds.hash_sha256.execute(p(['test'])).payload;
  const h2 = cmds.hash_sha256.execute(p(['test'])).payload;
  ok('hash_sha256: deterministic', h1 === h2 && h1.length === 64, h1);
};
