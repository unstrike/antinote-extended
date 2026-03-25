(function() {
  const extensionName = "mac_tools";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Utilities",
    dataScope: "none"
  });

  // OUI database — 6-char uppercase hex prefix → vendor name
  const OUI = {
    // Apple
    '000A27': 'Apple, Inc.',    '000D93': 'Apple, Inc.',    '001124': 'Apple, Inc.',
    '001451': 'Apple, Inc.',    '0017F2': 'Apple, Inc.',    '001B63': 'Apple, Inc.',
    '001CB3': 'Apple, Inc.',    '001E52': 'Apple, Inc.',    '001F5B': 'Apple, Inc.',
    '0021E9': 'Apple, Inc.',    '002312': 'Apple, Inc.',    '002500': 'Apple, Inc.',
    '0026BB': 'Apple, Inc.',    '003EE1': 'Apple, Inc.',    '00DB70': 'Apple, Inc.',
    '040CCE': 'Apple, Inc.',    '0C1539': 'Apple, Inc.',    '0C3E9F': 'Apple, Inc.',
    '100000': 'Apple, Inc.',    '1040F3': 'Apple, Inc.',    '109A24': 'Apple, Inc.',
    '14109F': 'Apple, Inc.',    '1499E2': 'Apple, Inc.',    '18AF61': 'Apple, Inc.',
    '1C91BA': 'Apple, Inc.',    '24A074': 'Apple, Inc.',    '28CFE9': 'Apple, Inc.',
    '2C1F23': 'Apple, Inc.',    '300E06': 'Apple, Inc.',    '34159E': 'Apple, Inc.',
    '38C986': 'Apple, Inc.',    '3C15C2': 'Apple, Inc.',    '3C2EF9': 'Apple, Inc.',
    '40A6D9': 'Apple, Inc.',    '40CBC0': 'Apple, Inc.',    '40D32D': 'Apple, Inc.',
    '440010': 'Apple, Inc.',    '44FB42': 'Apple, Inc.',    '48A195': 'Apple, Inc.',
    '4C74BF': 'Apple, Inc.',    '5065F3': 'Apple, Inc.',    '5404A6': 'Apple, Inc.',
    '5C8D4E': 'Apple, Inc.',    '6003B0': 'Apple, Inc.',    '600308': 'Apple, Inc.',
    '6C3CB5': 'Apple, Inc.',    '6C709F': 'Apple, Inc.',    '6C96CF': 'Apple, Inc.',
    '70EC4E': 'Apple, Inc.',    '74E20B': 'Apple, Inc.',    '7C11BE': 'Apple, Inc.',
    '7CF05F': 'Apple, Inc.',    '80007F': 'Apple, Inc.',    '80919F': 'Apple, Inc.',
    '8478AC': 'Apple, Inc.',    '84B153': 'Apple, Inc.',    '84FC66': 'Apple, Inc.',
    '88635D': 'Apple, Inc.',    '88CB87': 'Apple, Inc.',    '8C2937': 'Apple, Inc.',
    '8C8590': 'Apple, Inc.',    '90272C': 'Apple, Inc.',    '98FE94': 'Apple, Inc.',
    '9CF387': 'Apple, Inc.',    'A0999B': 'Apple, Inc.',    'A45E60': 'Apple, Inc.',
    'A4C361': 'Apple, Inc.',    'A82066': 'Apple, Inc.',    'AC3C0B': 'Apple, Inc.',
    'AC87A3': 'Apple, Inc.',    'B418D1': 'Apple, Inc.',    'B8098A': 'Apple, Inc.',
    'B8C75D': 'Apple, Inc.',    'BC3BAF': 'Apple, Inc.',    'BC4CC4': 'Apple, Inc.',
    'C0847D': 'Apple, Inc.',    'C82A14': 'Apple, Inc.',    'C8B5AD': 'Apple, Inc.',
    'CC08E0': 'Apple, Inc.',    'D02B20': 'Apple, Inc.',    'D0817A': 'Apple, Inc.',
    'D4619D': 'Apple, Inc.',    'D831CF': 'Apple, Inc.',    'D8306F': 'Apple, Inc.',
    'D83062': 'Apple, Inc.',    'DC2B61': 'Apple, Inc.',    'E0B9BA': 'Apple, Inc.',
    'E0F847': 'Apple, Inc.',    'E4CE8F': 'Apple, Inc.',    'ECF4BB': 'Apple, Inc.',
    'F018E7': 'Apple, Inc.',    'F01898': 'Apple, Inc.',    'F0B479': 'Apple, Inc.',
    'F45C89': 'Apple, Inc.',    'F81EDF': 'Apple, Inc.',    'FC253F': 'Apple, Inc.',
    // Cisco
    '000000': 'Xerox Corporation',
    '00000C': 'Cisco Systems',    '000186': 'Cisco Systems',    '00021B': 'Cisco Systems',
    '000259': 'Cisco Systems',    '0002FD': 'Cisco Systems',    '000CB4': 'Cisco Systems',
    '000D65': 'Cisco Systems',    '000E38': 'Cisco Systems',    '000F8F': 'Cisco Systems',
    '001143': 'Cisco Systems',    '0014A9': 'Cisco Systems',    '00166F': 'Cisco Systems',
    '001801': 'Cisco Systems',    '00196D': 'Cisco Systems',    '001AA1': 'Cisco Systems',
    '001B0C': 'Cisco Systems',    '001B2A': 'Cisco Systems',    '001BE5': 'Cisco Systems',
    '001C57': 'Cisco Systems',    '001DA2': 'Cisco Systems',    '001E13': 'Cisco Systems',
    '001E49': 'Cisco Systems',    '001E7A': 'Cisco Systems',    '001EBD': 'Cisco Systems',
    '001F26': 'Cisco Systems',    '001F6C': 'Cisco Systems',    '002155': 'Cisco Systems',
    '0021A0': 'Cisco Systems',    '002197': 'Cisco Systems',    '0022BD': 'Cisco Systems',
    '002490': 'Cisco Systems',    '0024C4': 'Cisco Systems',    '0025B4': 'Cisco Systems',
    '002591': 'Cisco Systems',    '00259C': 'Cisco Systems',    '0050BF': 'Cisco Systems',
    '005080': 'Cisco Systems',    '00E0F9': 'Cisco Systems',    'C89C1D': 'Cisco Systems',
    // VMware / Virtualization
    '000569': 'VMware, Inc.',    '000C29': 'VMware, Inc.',    '001C14': 'VMware, Inc.',
    '005056': 'VMware, Inc.',    '080027': 'PCS Systemtechnik (VirtualBox)',
    '525400': 'QEMU/KVM (virtual)',
    // Microsoft
    '0003FF': 'Microsoft Corporation',    '0008D3': 'Microsoft Corporation',
    '000D3A': 'Microsoft Corporation',    '00125A': 'Microsoft Corporation',
    '00155D': 'Microsoft Corporation',    '00185A': 'Microsoft Corporation',
    '001DD8': 'Microsoft Corporation',    '002248': 'Microsoft Corporation',
    '002569': 'Microsoft Corporation',    '28186D': 'Microsoft Corporation',
    '485073': 'Microsoft Corporation',    '601530': 'Microsoft Corporation',
    '7C1E52': 'Microsoft Corporation',    'B8CA3A': 'Microsoft Corporation',
    // Samsung
    '0000F0': 'Samsung Electronics',    '000DE5': 'Samsung Electronics',
    '000FE7': 'Samsung Electronics',    '0015B9': 'Samsung Electronics',
    '001632': 'Samsung Electronics',    '0017C9': 'Samsung Electronics',
    '001849': 'Samsung Electronics',    '001EE1': 'Samsung Electronics',
    '002195': 'Samsung Electronics',    '002339': 'Samsung Electronics',
    '0023C2': 'Samsung Electronics',    '0023D6': 'Samsung Electronics',
    '00265D': 'Samsung Electronics',    '002692': 'Samsung Electronics',
    '9C0298': 'Samsung Electronics',    'A8F274': 'Samsung Electronics',
    // Google
    '3C5AB4': 'Google, Inc.',    '54607E': 'Google, Inc.',    '7C2E0C': 'Google, Inc.',
    'A47733': 'Google, Inc.',    'F88FCA': 'Google, Inc.',
    // Amazon
    '40B4CD': 'Amazon Technologies',    '44650D': 'Amazon Technologies',
    '4CBB58': 'Amazon Technologies',    '68372E': 'Amazon Technologies',
    '8C1779': 'Amazon Technologies',    'A002DC': 'Amazon Technologies',
    'F0272D': 'Amazon Technologies',    'F81A67': 'Amazon Technologies',
    // Intel
    '001111': 'Intel Corporate',    '001301': 'Intel Corporate',    '001320': 'Intel Corporate',
    '0015E9': 'Intel Corporate',    '001C23': 'Intel Corporate',    '001D92': 'Intel Corporate',
    '001EE5': 'Intel Corporate',    '002129': 'Intel Corporate',    '0022FB': 'Intel Corporate',
    '002348': 'Intel Corporate',    '0024D7': 'Intel Corporate',    '00269E': 'Intel Corporate',
    '3425C4': 'Intel Corporate',    '40251E': 'Intel Corporate',    '4CB199': 'Intel Corporate',
    '5CF951': 'Intel Corporate',    '6045CB': 'Intel Corporate',    '7085C2': 'Intel Corporate',
    '80861B': 'Intel Corporate',    '8086F2': 'Intel Corporate',    '9CCB01': 'Intel Corporate',
    'A4C3F0': 'Intel Corporate',    'B0B437': 'Intel Corporate',    'D0509E': 'Intel Corporate',
    // Ubiquiti
    '002722': 'Ubiquiti Networks',    '0418D6': 'Ubiquiti Networks',
    '243A07': 'Ubiquiti Networks',    '44D9E7': 'Ubiquiti Networks',
    '68722D': 'Ubiquiti Networks',    '788A20': 'Ubiquiti Networks',
    '802AA8': 'Ubiquiti Networks',    'B4FBE4': 'Ubiquiti Networks',
    'DC9FDB': 'Ubiquiti Networks',    'E063DA': 'Ubiquiti Networks',
    'F09FC2': 'Ubiquiti Networks',    'F4E2C6': 'Ubiquiti Networks',
    // TP-Link
    '001080': 'TP-Link Technologies',    '006EB6': 'TP-Link Technologies',
    '00259E': 'TP-Link Technologies',    '1062EB': 'TP-Link Technologies',
    '14CC20': 'TP-Link Technologies',    '18D61C': 'TP-Link Technologies',
    '1C61B4': 'TP-Link Technologies',    '2008ED': 'TP-Link Technologies',
    '246B96': 'TP-Link Technologies',    '2C4D54': 'TP-Link Technologies',
    '3C46D8': 'TP-Link Technologies',    '50BD5F': 'TP-Link Technologies',
    '544A16': 'TP-Link Technologies',    '5C628B': 'TP-Link Technologies',
    '602AD0': 'TP-Link Technologies',    '64702A': 'TP-Link Technologies',
    '6C5AB0': 'TP-Link Technologies',    '700F6A': 'TP-Link Technologies',
    '74DADA': 'TP-Link Technologies',    '80DB55': 'TP-Link Technologies',
    '8CFAB1': 'TP-Link Technologies',    '90F6521': 'TP-Link Technologies',
    'A42BB0': 'TP-Link Technologies',    'AC84C6': 'TP-Link Technologies',
    'B0487A': 'TP-Link Technologies',    'B4B024': 'TP-Link Technologies',
    'C4E984': 'TP-Link Technologies',    'D46E5C': 'TP-Link Technologies',
    'D8EB97': 'TP-Link Technologies',    'E848B8': 'TP-Link Technologies',
    'EC086B': 'TP-Link Technologies',    'F0A731': 'TP-Link Technologies',
    // Netgear
    '00095B': 'Netgear',    '000FB5': 'Netgear',    '001422': 'Netgear',
    '001B2F': 'Netgear',    '001E2A': 'Netgear',    '0022B0': 'Netgear',
    '002638': 'Netgear',    '00406C': 'Netgear',    '1042B2': 'Netgear',
    '20E52A': 'Netgear',    '28C68E': 'Netgear',    '2CB05D': 'Netgear',
    '344DEA': 'Netgear',    '4496A9': 'Netgear',    '4C60DE': 'Netgear',
    '6C1C39': 'Netgear',    '9C3426': 'Netgear',    'A040A0': 'Netgear',
    'C03F0E': 'Netgear',    'C0FFD4': 'Netgear',    'E091F5': 'Netgear',
    // D-Link
    '001195': 'D-Link Corporation',    '0015E9': 'D-Link Corporation',
    '001E58': 'D-Link Corporation',    '00215D': 'D-Link Corporation',
    '002401': 'D-Link Corporation',    '0026B9': 'D-Link Corporation',
    '14D64D': 'D-Link Corporation',    '1C7EE5': 'D-Link Corporation',
    '28107B': 'D-Link Corporation',    '1C5F2B': 'D-Link Corporation',
    '34080A': 'D-Link Corporation',    '50465D': 'D-Link Corporation',
    '788DF7': 'D-Link Corporation',    '84C9B2': 'D-Link Corporation',
    'B8A386': 'D-Link Corporation',    'C0A0BB': 'D-Link Corporation',
    'CCB255': 'D-Link Corporation',    'E46F13': 'D-Link Corporation',
    'F07D68': 'D-Link Corporation',    'FC7516': 'D-Link Corporation',
    // Dell
    '001143': 'Dell Inc.',    '001372': 'Dell Inc.',    '001568': 'Dell Inc.',
    '001A4B': 'Dell Inc.',    '001EC9': 'Dell Inc.',    '002170': 'Dell Inc.',
    '0023AE': 'Dell Inc.',    '002564': 'Dell Inc.',    '00266C': 'Dell Inc.',
    '18037E': 'Dell Inc.',    '24BE05': 'Dell Inc.',    '2849C3': 'Dell Inc.',
    '34480A': 'Dell Inc.',    '3825E4': 'Dell Inc.',    '44A842': 'Dell Inc.',
    '484DEA': 'Dell Inc.',    '5CF9DD': 'Dell Inc.',    '788483': 'Dell Inc.',
    '848F69': 'Dell Inc.',    '906CB4': 'Dell Inc.',    'A4BADB': 'Dell Inc.',
    'B083FE': 'Dell Inc.',    'B4969D': 'Dell Inc.',    'C81F66': 'Dell Inc.',
    'D067E5': 'Dell Inc.',    'D4BED9': 'Dell Inc.',    'ECAD11': 'Dell Inc.',
    'F04DA2': 'Dell Inc.',    'F48E38': 'Dell Inc.',    'F8BC12': 'Dell Inc.',
    // Aruba / HPE
    '000BD3': 'Aruba Networks',    '001A1E': 'Aruba Networks',    '001FF3': 'Aruba Networks',
    '002369': 'Aruba Networks',    '00247D': 'Aruba Networks',    '006045': 'Aruba Networks',
    '1C2803': 'Aruba Networks',    '205A0E': 'Aruba Networks',    '24DE C6': 'Aruba Networks',
    '40E3D6': 'Aruba Networks',    '7CB2B2': 'Aruba Networks',    '8452E1': 'Aruba Networks',
    '9C1C12': 'Aruba Networks',    'AC3744': 'Aruba Networks',    'B4FBE4': 'Aruba Networks',
    'D067E5': 'Aruba Networks',    'E8ED05': 'Aruba Networks',    'F0A30B': 'Aruba Networks',
    // Broadcom
    '001018': 'Broadcom',    '00105A': 'Broadcom',    '001BD9': 'Broadcom',
    '001D09': 'Broadcom',    '002207': 'Broadcom',    '00226B': 'Broadcom',
    '001FCA': 'Broadcom',    '00904C': 'Broadcom',    '003A9A': 'Broadcom',
    // Realtek
    '00E04C': 'Realtek Semiconductor',    '001C42': 'Realtek Semiconductor',
    '44332B': 'Realtek Semiconductor',    '4C1C99': 'Realtek Semiconductor',
    '8C1645': 'Realtek Semiconductor',    'B88D12': 'Realtek Semiconductor',
    'E04F43': 'Realtek Semiconductor',
    // Qualcomm / Atheros
    '002374': 'Qualcomm/Atheros',    '002622': 'Qualcomm/Atheros',
    '00263E': 'Qualcomm/Atheros',    '002702': 'Qualcomm/Atheros',
    '00904D': 'Qualcomm',    '7CF90E': 'Qualcomm',    'A078E5': 'Qualcomm',
    // Raspberry Pi
    'B827EB': 'Raspberry Pi Foundation',    'DC1168': 'Raspberry Pi Foundation',
    'E45F01': 'Raspberry Pi Foundation',
    // IANA / Special
    '00005E': 'IANA (VRRP)',
  };

  function normalizeMac(mac) {
    // Accepts: AA:BB:CC:DD:EE:FF, AA-BB-CC-DD-EE-FF, AABBCCDDEEFF, AABB.CCDD.EEFF
    return mac.trim().replace(/[:\-\.]/g, '').toUpperCase();
  }

  function validateMac(hex) {
    return /^[0-9A-F]{12}$/.test(hex);
  }

  function getOui(hex) {
    return hex.slice(0, 6);
  }

  function formatMac(hex) {
    return hex.match(/.{2}/g).join(':');
  }

  // --- mac_info ---

  const mac_info = new Command({
    name: "mac_info",
    parameters: [
      new Parameter({type: "string", name: "mac", helpText: "MAC address (any common format)", default: "00:00:0C:01:02:03"})
    ],
    type: "replaceLine",
    helpText: "Look up vendor info for a MAC address using the OUI database.",
    tutorials: [
      new TutorialCommand({command: "mac_info(00:00:0C:01:02:03)", description: "Look up Cisco OUI"}),
      new TutorialCommand({command: "mac_info(00:0C:29:AB:CD:EF)", description: "Identify VMware MAC"}),
      new TutorialCommand({command: "mac_info(F8:1E:DF:01:02:03)", description: "Look up Apple OUI"})
    ],
    extension: extensionRoot
  });
  mac_info.execute = function(payload) {
    const [mac] = this.getParsedParams(payload);
    const hex = normalizeMac(mac);
    if (!validateMac(hex)) return new ReturnObject({status: "error", message: "Invalid MAC address: " + mac});
    const oui = getOui(hex);
    const vendor = OUI[oui] || 'Unknown Vendor';
    return new ReturnObject({
      status: "success",
      message: "",
      payload: formatMac(hex) + "  |  OUI: " + oui + "  |  " + vendor
    });
  };

  // --- mac_type ---

  const mac_type = new Command({
    name: "mac_type",
    parameters: [
      new Parameter({type: "string", name: "mac", helpText: "MAC address (any common format)", default: "FF:FF:FF:FF:FF:FF"})
    ],
    type: "replaceLine",
    helpText: "Identify MAC address type: unicast/multicast, globally/locally administered, broadcast.",
    tutorials: [
      new TutorialCommand({command: "mac_type(FF:FF:FF:FF:FF:FF)", description: "Broadcast"}),
      new TutorialCommand({command: "mac_type(01:00:5E:00:00:01)", description: "IPv4 Multicast"}),
      new TutorialCommand({command: "mac_type(00:1A:2B:3C:4D:5E)", description: "Unicast, Globally Administered"}),
      new TutorialCommand({command: "mac_type(02:00:00:00:00:01)", description: "Unicast, Locally Administered"})
    ],
    extension: extensionRoot
  });
  mac_type.execute = function(payload) {
    const [mac] = this.getParsedParams(payload);
    const hex = normalizeMac(mac);
    if (!validateMac(hex)) return new ReturnObject({status: "error", message: "Invalid MAC address: " + mac});

    const firstOctet = parseInt(hex.slice(0, 2), 16);
    const isBroadcast = hex === 'FFFFFFFFFFFF';
    const isMulticast = (firstOctet & 0x01) === 1;
    const isLocalAdmin = (firstOctet & 0x02) === 2;

    let typeStr;
    if (isBroadcast) {
      typeStr = 'Broadcast (FF:FF:FF:FF:FF:FF)';
    } else {
      const castType = isMulticast ? 'Multicast' : 'Unicast';
      const adminType = isLocalAdmin ? 'Locally Administered (LAA)' : 'Globally Administered (OUI)';
      typeStr = castType + ', ' + adminType;
      if (hex.slice(0, 4) === '0100' || hex.slice(0, 6) === '01005E') {
        typeStr += '  [IPv4 Multicast range]';
      } else if (hex.slice(0, 6) === '333300') {
        typeStr += '  [IPv6 Multicast range]';
      }
    }

    return new ReturnObject({status: "success", message: "", payload: formatMac(hex) + "  →  " + typeStr});
  };

})();
