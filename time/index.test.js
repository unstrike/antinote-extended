'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('time');
  let r;

  // epoch
  r = cmds.epoch.execute(p(['2024-01-15']));
  ok('epoch: 2024-01-15 = 1705276800', r.status === 'success' && r.payload === '1705276800', r.payload);

  r = cmds.epoch.execute(p(['now']));
  ok('epoch: now → positive integer', r.status === 'success' && parseInt(r.payload) > 1700000000, r.payload);

  r = cmds.epoch.execute(p(['not a date']));
  ok('epoch: invalid date → error', r.status === 'error', null);

  // from_epoch
  r = cmds.from_epoch.execute(p(['1705276800']));
  ok('from_epoch: 1705276800 → 2024-01-15 00:00:00 UTC', r.status === 'success' && r.payload === '2024-01-15 00:00:00 UTC', r.payload);

  r = cmds.from_epoch.execute(p(['0']));
  ok('from_epoch: 0 → 1970-01-01 00:00:00 UTC', r.status === 'success' && r.payload === '1970-01-01 00:00:00 UTC', r.payload);

  // now
  r = cmds.now.execute(p([]));
  ok('now: returns current timestamp', r.status === 'success' && parseInt(r.payload) > 1700000000, r.payload);

  // date_diff
  r = cmds.date_diff.execute(p(['2024-01-01', '2024-12-31']));
  ok('date_diff: 2024-01-01 to 2024-12-31 = 365d', r.status === 'success' && r.payload.includes('365d'), r.payload);

  r = cmds.date_diff.execute(p(['2024-01-01', '2024-01-01']));
  ok('date_diff: same date = 0s', r.status === 'success' && r.payload === '0s', r.payload);

  r = cmds.date_diff.execute(p(['2024-01-01', '']));
  ok('date_diff: empty second date → error', r.status === 'error', null);

  // tz_convert
  r = cmds.tz_convert.execute(p(['1705276800', 'UTC']));
  ok('tz_convert: UTC', r.status === 'success' && r.payload.includes('2024-01-15') && r.payload.includes('UTC'), r.payload);

  r = cmds.tz_convert.execute(p(['1705276800', 'Not/ATimezone']));
  ok('tz_convert: invalid timezone → error', r.status === 'error', null);

  r = cmds.tz_convert.execute(p(['', 'UTC']));
  ok('tz_convert: empty timestamp → error', r.status === 'error', null);
};
