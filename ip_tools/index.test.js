'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('ip_tools');
  let r;

  r = cmds.cidr_info.execute(p(['192.168.1.0/24']));
  ok('cidr_info: /24 network', r.status === 'success' && r.payload.includes('192.168.1.0/24'), null);
  ok('cidr_info: /24 broadcast', r.payload && r.payload.includes('192.168.1.255'), null);
  ok('cidr_info: /24 254 usable', r.payload && r.payload.includes('254'), null);

  r = cmds.cidr_info.execute(p(['10.0.0.0/8']));
  ok('cidr_info: /8', r.status === 'success' && r.payload.includes('10.0.0.0/8'), null);

  r = cmds.cidr_info.execute(p(['192.168.1.0/31']));
  ok('cidr_info: /31 no broadcast subtraction', r.status === 'success', null);

  r = cmds.cidr_info.execute(p(['bad input']));
  ok('cidr_info: invalid → error', r.status === 'error', null);

  r = cmds.ip_info.execute(p(['192.168.1.1']));
  ok('ip_info: private (192.168)', r.status === 'success' && r.payload.includes('private'), null);

  r = cmds.ip_info.execute(p(['10.0.0.1']));
  ok('ip_info: private (10.x)', r.status === 'success' && r.payload.includes('private'), null);

  r = cmds.ip_info.execute(p(['8.8.8.8']));
  ok('ip_info: public', r.status === 'success' && r.payload.includes('public'), null);

  r = cmds.ip_info.execute(p(['127.0.0.1']));
  ok('ip_info: loopback', r.status === 'success' && r.payload.includes('loopback'), null);

  r = cmds.ip_info.execute(p(['224.0.0.1']));
  ok('ip_info: multicast', r.status === 'success' && r.payload.includes('multicast'), null);

  r = cmds.ip_info.execute(p(['999.0.0.1']));
  ok('ip_info: invalid → error', r.status === 'error', null);

  r = cmds.ip_in_cidr.execute(p(['192.168.1.50', '192.168.1.0/24']));
  ok('ip_in_cidr: inside range', r.status === 'success' && r.payload.includes('IN'), r.payload);

  r = cmds.ip_in_cidr.execute(p(['10.0.0.1', '192.168.1.0/24']));
  ok('ip_in_cidr: outside range', r.status === 'success' && r.payload.includes('NOT'), r.payload);

  r = cmds.ip_in_cidr.execute(p(['192.168.1.0', '192.168.1.0/24']));
  ok('ip_in_cidr: network address is IN', r.status === 'success' && r.payload.includes('IN'), r.payload);

  r = cmds.subnet_mask.execute(p([24]));
  ok('subnet_mask: /24 = 255.255.255.0', r.status === 'success' && r.payload.includes('255.255.255.0'), r.payload);

  r = cmds.subnet_mask.execute(p([16]));
  ok('subnet_mask: /16 = 255.255.0.0', r.status === 'success' && r.payload.includes('255.255.0.0'), r.payload);

  r = cmds.subnet_mask.execute(p([0]));
  ok('subnet_mask: /0 = 0.0.0.0', r.status === 'success' && r.payload.includes('0.0.0.0'), r.payload);

  r = cmds.subnet_mask.execute(p([33]));
  ok('subnet_mask: /33 → error', r.status === 'error', null);

  r = cmds.ip_to_binary.execute(p(['192.168.1.1']));
  ok('ip_to_binary: starts with 11000000.10101000', r.status === 'success' && r.payload.includes('11000000.10101000'), r.payload);

  r = cmds.ip_to_binary.execute(p(['255.255.255.0']));
  ok('ip_to_binary: 255.255.255.0', r.payload && r.payload.includes('11111111.11111111.11111111.00000000'), r.payload);
};
