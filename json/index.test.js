'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('json');
  const uglyJSON = '{"a":1,"b":[1,2],"c":{"d":true}}';
  let r;

  r = cmds.json_validate.execute(p([], uglyJSON));
  ok('json_validate: valid object', r.status === 'success' && r.payload.includes('Valid') && r.payload.includes('object'), r.payload);

  r = cmds.json_validate.execute(p([], '[1,2,3]'));
  ok('json_validate: array with 3 items', r.status === 'success' && r.payload.includes('array') && r.payload.includes('3'), r.payload);

  r = cmds.json_validate.execute(p([], '{bad}'));
  ok('json_validate: invalid → error', r.status === 'error', null);

  r = cmds.json_validate.execute(p([], ''));
  ok('json_validate: empty → error', r.status === 'error', null);

  r = cmds.json_extract.execute(p(['.'], uglyJSON));
  ok('json_extract: root path returns object', r.status === 'success', null);

  r = cmds.json_extract.execute(p(['.a'], uglyJSON));
  ok('json_extract: .a = 1', r.status === 'success' && r.payload === '1', r.payload);

  r = cmds.json_extract.execute(p(['.b[0]'], uglyJSON));
  ok('json_extract: .b[0] = 1', r.status === 'success' && r.payload === '1', r.payload);

  r = cmds.json_extract.execute(p(['.b[1]'], uglyJSON));
  ok('json_extract: .b[1] = 2', r.status === 'success' && r.payload === '2', r.payload);

  r = cmds.json_extract.execute(p(['.c.d'], uglyJSON));
  ok('json_extract: .c.d = true', r.status === 'success' && r.payload === 'true', r.payload);

  r = cmds.json_extract.execute(p(['.missing'], uglyJSON));
  ok('json_extract: missing key → error', r.status === 'error', null);

  r = cmds.json_extract.execute(p(['.a'], ''));
  ok('json_extract: empty note → error', r.status === 'error', null);
};
