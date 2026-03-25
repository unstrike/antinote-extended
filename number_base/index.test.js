'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('number_base');
  let r;

  // to_hex
  r = cmds.to_hex.execute(p(['255']));
  ok('to_hex: 255 → 0xFF', r.status === 'success' && r.payload === '0xFF', r.payload);

  r = cmds.to_hex.execute(p(['0']));
  ok('to_hex: 0 → 0x0', r.status === 'success' && r.payload === '0x0', r.payload);

  r = cmds.to_hex.execute(p(['65535']));
  ok('to_hex: 65535 → 0xFFFF', r.status === 'success' && r.payload === '0xFFFF', r.payload);

  r = cmds.to_hex.execute(p(['abc']));
  ok('to_hex: non-integer → error', r.status === 'error', null);

  // to_bin
  r = cmds.to_bin.execute(p(['255']));
  ok('to_bin: 255 → 0b11111111', r.status === 'success' && r.payload === '0b11111111', r.payload);

  r = cmds.to_bin.execute(p(['10']));
  ok('to_bin: 10 → 0b1010', r.status === 'success' && r.payload === '0b1010', r.payload);

  // to_oct
  r = cmds.to_oct.execute(p(['255']));
  ok('to_oct: 255 → 0o377', r.status === 'success' && r.payload === '0o377', r.payload);

  r = cmds.to_oct.execute(p(['8']));
  ok('to_oct: 8 → 0o10', r.status === 'success' && r.payload === '0o10', r.payload);

  // to_dec
  r = cmds.to_dec.execute(p(['FF', 16]));
  ok('to_dec: hex FF → 255', r.status === 'success' && r.payload === '255', r.payload);

  r = cmds.to_dec.execute(p(['11111111', 2]));
  ok('to_dec: binary → 255', r.status === 'success' && r.payload === '255', r.payload);

  r = cmds.to_dec.execute(p(['377', 8]));
  ok('to_dec: octal → 255', r.status === 'success' && r.payload === '255', r.payload);

  r = cmds.to_dec.execute(p(['FF', 1]));
  ok('to_dec: base 1 → error', r.status === 'error', null);

  r = cmds.to_dec.execute(p(['ZZ', 16]));
  ok('to_dec: invalid hex → error', r.status === 'error', null);

  // byte_size
  r = cmds.byte_size.execute(p(['hello']));
  ok('byte_size: hello = 5 bytes, 5 chars', r.status === 'success' && r.payload === '5 bytes, 5 chars', r.payload);

  r = cmds.byte_size.execute(p(['café']));
  ok('byte_size: café = 5 bytes, 4 chars', r.status === 'success' && r.payload === '5 bytes, 4 chars', r.payload);

  r = cmds.byte_size.execute(p(['']));
  ok('byte_size: empty = 0 bytes, 0 chars', r.status === 'success' && r.payload === '0 bytes, 0 chars', r.payload);
};
