'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('recon');
  let r;

  // Input validation
  r = cmds.asn_lookup.execute(p(['']));
  ok('asn_lookup: empty → error', r.status === 'error', null);

  r = cmds.asn_lookup.execute(p(['notanip']));
  ok('asn_lookup: invalid input → error', r.status === 'error', null);

  r = cmds.asn_lookup.execute(p(['999.0.0.1']));
  ok('asn_lookup: invalid IP format passes validation, fails network', r.status === 'error', null);

  // Valid inputs pass validation but fail on network (callAPI mock)
  r = cmds.asn_lookup.execute(p(['1.1.1.1']));
  ok('asn_lookup: valid IP → network error → graceful error', r.status === 'error', null);

  r = cmds.asn_lookup.execute(p(['AS13335']));
  ok('asn_lookup: ASN with prefix → network error → graceful error', r.status === 'error', null);

  r = cmds.asn_lookup.execute(p(['13335']));
  ok('asn_lookup: ASN without prefix → network error → graceful error', r.status === 'error', null);
};
