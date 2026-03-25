(function() {
  const extensionName = "ip_tools";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Networking",
    dataScope: "none"
  });

  // === Helpers ===

  function ipToInt(ip) {
    const p = ip.trim().split('.');
    return ((parseInt(p[0]) << 24) | (parseInt(p[1]) << 16) | (parseInt(p[2]) << 8) | parseInt(p[3])) >>> 0;
  }

  function intToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }

  function isValidIPv4(ip) {
    if (!ip) return false;
    const parts = ip.trim().split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => {
      const n = parseInt(p, 10);
      return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p.trim();
    });
  }

  function prefixToMask(prefix) {
    if (prefix === 0) return 0;
    return (~0 << (32 - prefix)) >>> 0;
  }

  function ipToBinary(ip) {
    return ip.trim().split('.').map(o => parseInt(o).toString(2).padStart(8, '0')).join('.');
  }

  function getIPType(ipInt) {
    if ((ipInt & 0xFF000000) >>> 0 === 0x7F000000) return "loopback";
    if ((ipInt & 0xFFFF0000) >>> 0 === 0xA9FE0000) return "link-local";
    if ((ipInt & 0xFF000000) >>> 0 === 0x0A000000) return "private (10.x.x.x)";
    if ((ipInt & 0xFFF00000) >>> 0 === 0xAC100000) return "private (172.16–31.x.x)";
    if ((ipInt & 0xFFFF0000) >>> 0 === 0xC0A80000) return "private (192.168.x.x)";
    if ((ipInt & 0xF0000000) >>> 0 === 0xE0000000) return "multicast";
    if ((ipInt & 0xF0000000) >>> 0 === 0xF0000000) return "reserved";
    return "public";
  }

  function getIPClass(ipInt) {
    const first = (ipInt >>> 24) & 0xFF;
    if (first < 128) return "A";
    if (first < 192) return "B";
    if (first < 224) return "C";
    if (first < 240) return "D (multicast)";
    return "E (reserved)";
  }

  function parseCIDR(cidr) {
    const parts = cidr.trim().split('/');
    if (parts.length !== 2) return null;
    const prefix = parseInt(parts[1], 10);
    if (!isValidIPv4(parts[0]) || isNaN(prefix) || prefix < 0 || prefix > 32) return null;
    return { ip: parts[0].trim(), prefix };
  }

  // === Commands ===

  // 1. cidr_info — full CIDR breakdown
  const cidr_info = new Command({
    name: "cidr_info",
    parameters: [
      new Parameter({type: "string", name: "cidr", helpText: "CIDR notation (e.g., 192.168.1.0/24)", default: "192.168.1.0/24"})
    ],
    type: "insert",
    helpText: "Show full breakdown of a CIDR block: network, broadcast, hosts, mask, wildcard.",
    tutorials: [
      new TutorialCommand({command: "cidr_info(192.168.1.0/24)", description: "Breakdown of a /24 subnet"}),
      new TutorialCommand({command: "cidr_info(10.0.0.0/8)", description: "Breakdown of a Class A /8"}),
      new TutorialCommand({command: "cidr_info(172.16.0.0/12)", description: "Breakdown of 172.16.0.0/12"})
    ],
    extension: extensionRoot
  });

  cidr_info.execute = function(payload) {
    const [cidr] = this.getParsedParams(payload);
    const parsed = parseCIDR(cidr);
    if (!parsed) {
      return new ReturnObject({status: "error", message: "Invalid CIDR. Use format: 192.168.1.0/24"});
    }

    const { ip, prefix } = parsed;
    const maskInt     = prefixToMask(prefix);
    const ipInt       = ipToInt(ip);
    const networkInt  = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | ((~maskInt) >>> 0)) >>> 0;
    const wildcardInt = (~maskInt) >>> 0;

    const totalHosts  = Math.pow(2, 32 - prefix);
    const usableHosts = prefix >= 31 ? totalHosts : totalHosts - 2;
    const firstHost   = prefix >= 31 ? intToIp(networkInt)  : intToIp(networkInt + 1);
    const lastHost    = prefix >= 31 ? intToIp(broadcastInt) : intToIp(broadcastInt - 1);

    const lines = [
      `Network:     ${intToIp(networkInt)}/${prefix}`,
      `Subnet mask: ${intToIp(maskInt)}`,
      `Wildcard:    ${intToIp(wildcardInt)}`,
      `Broadcast:   ${intToIp(broadcastInt)}`,
      `First host:  ${firstHost}`,
      `Last host:   ${lastHost}`,
      `Hosts:       ${usableHosts.toLocaleString()} usable / ${totalHosts.toLocaleString()} total`
    ];

    return new ReturnObject({status: "success", message: "CIDR breakdown complete.", payload: lines.join('\n')});
  };

  // 2. ip_info — classification + binary + decimal
  const ip_info = new Command({
    name: "ip_info",
    parameters: [
      new Parameter({type: "string", name: "ip", helpText: "IPv4 address", default: "192.168.1.1"})
    ],
    type: "insert",
    helpText: "Show IPv4 address type (public/private/loopback/etc), class, binary, and decimal.",
    tutorials: [
      new TutorialCommand({command: "ip_info(192.168.1.1)", description: "Info for a private IP"}),
      new TutorialCommand({command: "ip_info(8.8.8.8)", description: "Info for a public IP"}),
      new TutorialCommand({command: "ip_info(127.0.0.1)", description: "Info for loopback"})
    ],
    extension: extensionRoot
  });

  ip_info.execute = function(payload) {
    const [ip] = this.getParsedParams(payload);
    if (!isValidIPv4(ip.trim())) {
      return new ReturnObject({status: "error", message: "Invalid IPv4 address."});
    }

    const ipInt  = ipToInt(ip.trim());
    const lines  = [
      `Address: ${ip.trim()}`,
      `Type:    ${getIPType(ipInt)}`,
      `Class:   ${getIPClass(ipInt)}`,
      `Binary:  ${ipToBinary(ip.trim())}`,
      `Decimal: ${ipInt}`
    ];

    return new ReturnObject({status: "success", message: "IP info retrieved.", payload: lines.join('\n')});
  };

  // 3. ip_in_cidr — range membership check
  const ip_in_cidr = new Command({
    name: "ip_in_cidr",
    parameters: [
      new Parameter({type: "string", name: "ip",   helpText: "IPv4 address to check", default: "192.168.1.50"}),
      new Parameter({type: "string", name: "cidr", helpText: "CIDR range (e.g., 192.168.1.0/24)", default: "192.168.1.0/24"})
    ],
    type: "replaceLine",
    helpText: "Check whether an IP address falls within a CIDR range.",
    tutorials: [
      new TutorialCommand({command: "ip_in_cidr(192.168.1.50, 192.168.1.0/24)", description: "Check if IP is in /24 subnet"}),
      new TutorialCommand({command: "ip_in_cidr(10.0.5.1, 10.0.0.0/16)", description: "Check if IP is in /16"})
    ],
    extension: extensionRoot
  });

  ip_in_cidr.execute = function(payload) {
    const [ip, cidr] = this.getParsedParams(payload);
    if (!isValidIPv4(ip.trim())) {
      return new ReturnObject({status: "error", message: "Invalid IPv4 address."});
    }
    const parsed = parseCIDR(cidr);
    if (!parsed) {
      return new ReturnObject({status: "error", message: "Invalid CIDR. Use format: 192.168.1.0/24"});
    }

    const maskInt    = prefixToMask(parsed.prefix);
    const ipInt      = ipToInt(ip.trim());
    const networkInt = ipToInt(parsed.ip);
    const inRange    = ((ipInt & maskInt) >>> 0) === ((networkInt & maskInt) >>> 0);
    const result     = inRange
      ? `${ip.trim()} is IN ${cidr.trim()}`
      : `${ip.trim()} is NOT in ${cidr.trim()}`;

    return new ReturnObject({status: "success", message: result, payload: result});
  };

  // 4. subnet_mask — prefix length → mask + wildcard
  const subnet_mask = new Command({
    name: "subnet_mask",
    parameters: [
      new Parameter({type: "int", name: "prefix", helpText: "Prefix length (0–32)", default: 24})
    ],
    type: "replaceLine",
    helpText: "Convert a CIDR prefix length to subnet mask and wildcard (inverse) mask.",
    tutorials: [
      new TutorialCommand({command: "subnet_mask(24)", description: "Mask for /24"}),
      new TutorialCommand({command: "subnet_mask(16)", description: "Mask for /16"}),
      new TutorialCommand({command: "subnet_mask(28)", description: "Mask for /28"})
    ],
    extension: extensionRoot
  });

  subnet_mask.execute = function(payload) {
    const [prefix] = this.getParsedParams(payload);
    if (prefix < 0 || prefix > 32) {
      return new ReturnObject({status: "error", message: "Prefix must be 0–32."});
    }
    const maskInt     = prefixToMask(prefix);
    const wildcardInt = (~maskInt) >>> 0;
    const result      = `/${prefix}  mask: ${intToIp(maskInt)}  wildcard: ${intToIp(wildcardInt)}`;
    return new ReturnObject({status: "success", message: "Subnet mask calculated.", payload: result});
  };

  // 5. ip_to_binary — IPv4 → dotted binary
  const ip_to_binary = new Command({
    name: "ip_to_binary",
    parameters: [
      new Parameter({type: "string", name: "ip", helpText: "IPv4 address", default: "192.168.1.1"})
    ],
    type: "replaceLine",
    helpText: "Convert an IPv4 address to dotted binary notation.",
    tutorials: [
      new TutorialCommand({command: "ip_to_binary(192.168.1.1)", description: "Binary of 192.168.1.1"}),
      new TutorialCommand({command: "ip_to_binary(255.255.255.0)", description: "Binary of a subnet mask"})
    ],
    extension: extensionRoot
  });

  ip_to_binary.execute = function(payload) {
    const [ip] = this.getParsedParams(payload);
    if (!isValidIPv4(ip.trim())) {
      return new ReturnObject({status: "error", message: "Invalid IPv4 address."});
    }
    const result = `${ip.trim()} = ${ipToBinary(ip.trim())}`;
    return new ReturnObject({status: "success", message: "Converted to binary.", payload: result});
  };

})();
