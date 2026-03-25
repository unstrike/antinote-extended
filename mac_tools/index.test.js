'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('mac_tools');
  let r;

  // mac_info
  r = cmds.mac_info.execute(p(['00:00:0C:01:02:03']));
  ok('mac_info: Cisco OUI', r.status === 'success' && r.payload.includes('Cisco'), r.payload);

  r = cmds.mac_info.execute(p(['F8:1E:DF:01:02:03']));
  ok('mac_info: Apple OUI', r.status === 'success' && r.payload.includes('Apple'), r.payload);

  r = cmds.mac_info.execute(p(['00:0C:29:AB:CD:EF']));
  ok('mac_info: VMware OUI', r.status === 'success' && r.payload.includes('VMware'), r.payload);

  r = cmds.mac_info.execute(p(['AABBCCDDEEFF']));
  ok('mac_info: no-separator format', r.status === 'success', r.payload);

  r = cmds.mac_info.execute(p(['AA-BB-CC-DD-EE-FF']));
  ok('mac_info: dash separator', r.status === 'success', r.payload);

  r = cmds.mac_info.execute(p(['bad input']));
  ok('mac_info: invalid → error', r.status === 'error', null);

  r = cmds.mac_info.execute(p(['ZZ:ZZ:ZZ:ZZ:ZZ:ZZ']));
  ok('mac_info: invalid hex → error', r.status === 'error', null);

  // mac_type
  r = cmds.mac_type.execute(p(['FF:FF:FF:FF:FF:FF']));
  ok('mac_type: broadcast', r.status === 'success' && r.payload.includes('Broadcast'), r.payload);

  r = cmds.mac_type.execute(p(['00:1A:2B:3C:4D:5E']));
  ok('mac_type: unicast globally administered', r.status === 'success' && r.payload.includes('Unicast') && r.payload.includes('Globally'), r.payload);

  r = cmds.mac_type.execute(p(['02:00:00:00:00:01']));
  ok('mac_type: unicast locally administered', r.status === 'success' && r.payload.includes('Locally Administered'), r.payload);

  r = cmds.mac_type.execute(p(['01:00:5E:00:00:01']));
  ok('mac_type: IPv4 multicast', r.status === 'success' && r.payload.includes('Multicast'), r.payload);

  r = cmds.mac_type.execute(p(['bad']));
  ok('mac_type: invalid → error', r.status === 'error', null);
};
