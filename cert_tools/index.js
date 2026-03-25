(function() {
  const extensionName = "cert_tools";

  // Reads full note; paste the PEM cert into the note and run cert_decode() / cert_days()
  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Utilities",
    dataScope: "full"
  });

  // === Base64 decoder ===

  function b64decode(str) {
    const T = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lut = {};
    for (let i = 0; i < T.length; i++) lut[T[i]] = i;
    const clean = str.replace(/[^A-Za-z0-9+/]/g, '');
    const bytes = [];
    for (let i = 0; i < clean.length; i += 4) {
      const a = lut[clean[i]] || 0, b = lut[clean[i+1]] || 0;
      const c = lut[clean[i+2]] || 0, d = lut[clean[i+3]] || 0;
      bytes.push((a << 2) | (b >> 4));
      if (clean[i+2] !== '=') bytes.push(((b & 0xF) << 4) | (c >> 2));
      if (clean[i+3] !== '=') bytes.push(((c & 0x3) << 6) | d);
    }
    return bytes;
  }

  // === ASN.1/DER parser ===

  function readTLV(bytes, offset) {
    if (offset >= bytes.length) throw new Error('Buffer overrun at offset ' + offset);
    const tag = bytes[offset++];
    let length;
    if (bytes[offset] & 0x80) {
      const numLen = bytes[offset++] & 0x7F;
      if (numLen === 0) throw new Error('Indefinite length not supported');
      length = 0;
      for (let i = 0; i < numLen; i++) length = (length * 256) + bytes[offset++];
    } else {
      length = bytes[offset++];
    }
    return { tag, length, vs: offset, end: offset + length };
  }

  function parseOID(bytes, start, len) {
    const end = start + len;
    const parts = [];
    let val = 0, first = true;
    for (let i = start; i < end; i++) {
      const b = bytes[i];
      val = (val << 7) | (b & 0x7F);
      if (!(b & 0x80)) {
        if (first) { parts.push(Math.floor(val / 40), val % 40); first = false; }
        else parts.push(val);
        val = 0;
      }
    }
    return parts.join('.');
  }

  function parseStr(bytes, start, len) {
    let s = '';
    for (let i = start; i < start + len; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }

  function parseTime(bytes, tag, vs, len) {
    const s = parseStr(bytes, vs, len);
    if (tag === 0x17) { // UTCTime: YYMMDDHHMMSSZ
      const y = parseInt(s.slice(0,2)); const fy = y >= 50 ? 1900+y : 2000+y;
      return fy + '-' + s.slice(2,4) + '-' + s.slice(4,6) + ' ' + s.slice(6,8) + ':' + s.slice(8,10) + ':' + s.slice(10,12) + 'Z';
    }
    // GeneralizedTime: YYYYMMDDHHMMSSZ
    return s.slice(0,4) + '-' + s.slice(4,6) + '-' + s.slice(6,8) + ' ' + s.slice(8,10) + ':' + s.slice(10,12) + ':' + s.slice(12,14) + 'Z';
  }

  const OID_MAP = {
    // Subject / Issuer attributes
    '2.5.4.3':  'CN', '2.5.4.4': 'SN', '2.5.4.5': 'serialNumber',
    '2.5.4.6':  'C',  '2.5.4.7': 'L',  '2.5.4.8': 'ST',
    '2.5.4.9':  'street', '2.5.4.10': 'O', '2.5.4.11': 'OU',
    '2.5.4.12': 'title', '2.5.4.17': 'postalCode',
    '1.2.840.113549.1.9.1': 'emailAddress',
    // Signature algorithms
    '1.2.840.113549.1.1.1':  'RSA',
    '1.2.840.113549.1.1.5':  'SHA1withRSA',
    '1.2.840.113549.1.1.11': 'SHA256withRSA',
    '1.2.840.113549.1.1.12': 'SHA384withRSA',
    '1.2.840.113549.1.1.13': 'SHA512withRSA',
    '1.2.840.10045.2.1':     'EC',
    '1.2.840.10045.4.3.2':   'SHA256withECDSA',
    '1.2.840.10045.4.3.3':   'SHA384withECDSA',
    '1.2.840.10045.4.3.4':   'SHA512withECDSA',
    '1.2.840.10040.4.1':     'DSA',
    '1.3.101.110': 'X25519', '1.3.101.111': 'X448',
    '1.3.101.112': 'Ed25519', '1.3.101.113': 'Ed448',
    // EC curves
    '1.2.840.10045.3.1.7':  'P-256',
    '1.3.132.0.34':         'P-384',
    '1.3.132.0.35':         'P-521',
    '1.3.132.0.10':         'secp256k1',
    // Extensions
    '2.5.29.17': 'SAN',
    '2.5.29.15': 'KeyUsage',
    '2.5.29.37': 'ExtKeyUsage',
    '2.5.29.19': 'BasicConstraints',
  };

  function parseRDN(bytes, start, len) {
    const attrs = {};
    let offset = start;
    const end = start + len;
    while (offset < end) {
      const set = readTLV(bytes, offset);
      if (set.tag === 0x31) {
        let so = set.vs;
        while (so < set.end) {
          const seq = readTLV(bytes, so);
          if (seq.tag === 0x30 && so + 2 < set.end) {
            const oidTLV = readTLV(bytes, seq.vs);
            if (oidTLV.tag === 0x06 && oidTLV.end < seq.end) {
              const oid = parseOID(bytes, oidTLV.vs, oidTLV.length);
              const valTLV = readTLV(bytes, oidTLV.end);
              const val = parseStr(bytes, valTLV.vs, valTLV.length);
              const name = OID_MAP[oid] || oid;
              attrs[name] = val;
            }
          }
          so = seq.end;
        }
      }
      offset = set.end;
    }
    return attrs;
  }

  function rdnToString(attrs) {
    const order = ['CN', 'O', 'OU', 'L', 'ST', 'C'];
    const parts = [];
    for (const k of order) { if (attrs[k]) parts.push(k + '=' + attrs[k]); }
    for (const k of Object.keys(attrs)) {
      if (!order.includes(k)) parts.push(k + '=' + attrs[k]);
    }
    return parts.join(', ');
  }

  function parseSAN(bytes, vs, len) {
    const sans = [];
    const sanSeq = readTLV(bytes, vs);
    let so = sanSeq.vs;
    while (so < sanSeq.end) {
      const gn = readTLV(bytes, so);
      const gnTag = gn.tag & 0x1F;
      if (gnTag === 2) { // dNSName
        sans.push(parseStr(bytes, gn.vs, gn.length));
      } else if (gnTag === 1) { // rfc822Name
        sans.push('email:' + parseStr(bytes, gn.vs, gn.length));
      } else if (gnTag === 6) { // URI
        sans.push('uri:' + parseStr(bytes, gn.vs, gn.length));
      } else if (gnTag === 7) { // iPAddress
        if (gn.length === 4) {
          sans.push(bytes.slice(gn.vs, gn.end).join('.'));
        } else if (gn.length === 16) {
          const parts = [];
          for (let i = 0; i < 16; i += 2)
            parts.push(((bytes[gn.vs+i] << 8) | bytes[gn.vs+i+1]).toString(16));
          sans.push(parts.join(':'));
        }
      }
      so = gn.end;
    }
    return sans;
  }

  function parseCert(der) {
    // Certificate SEQUENCE
    const certSeq = readTLV(der, 0);
    // TBSCertificate SEQUENCE
    const tbsSeq = readTLV(der, certSeq.vs);
    let offset = tbsSeq.vs;

    // version [0] EXPLICIT (optional)
    let tlv = readTLV(der, offset);
    if (tlv.tag === 0xA0) { offset = tlv.end; tlv = readTLV(der, offset); }

    // serialNumber INTEGER
    let serial = '';
    for (let i = tlv.vs; i < tlv.end; i++) serial += der[i].toString(16).padStart(2, '0');
    offset = tlv.end;

    // signatureAlgorithm SEQUENCE
    tlv = readTLV(der, offset);
    const sigAlgOidTLV = readTLV(der, tlv.vs);
    const sigAlg = OID_MAP[parseOID(der, sigAlgOidTLV.vs, sigAlgOidTLV.length)] || 'Unknown';
    offset = tlv.end;

    // issuer SEQUENCE
    tlv = readTLV(der, offset);
    const issuer = parseRDN(der, tlv.vs, tlv.length);
    offset = tlv.end;

    // validity SEQUENCE
    tlv = readTLV(der, offset);
    const vt1 = readTLV(der, tlv.vs);
    const vt2 = readTLV(der, vt1.end);
    const notBefore = parseTime(der, vt1.tag, vt1.vs, vt1.length);
    const notAfter  = parseTime(der, vt2.tag, vt2.vs, vt2.length);
    offset = tlv.end;

    // subject SEQUENCE
    tlv = readTLV(der, offset);
    const subject = parseRDN(der, tlv.vs, tlv.length);
    offset = tlv.end;

    // subjectPublicKeyInfo SEQUENCE
    tlv = readTLV(der, offset);
    const pkiAlgSeq = readTLV(der, tlv.vs);
    const pkiOidTLV = readTLV(der, pkiAlgSeq.vs);
    const pkiOid = parseOID(der, pkiOidTLV.vs, pkiOidTLV.length);
    let keyInfo = OID_MAP[pkiOid] || pkiOid;
    if (pkiOid === '1.2.840.113549.1.1.1') { // RSA
      const bsTLV = readTLV(der, pkiAlgSeq.end);
      try {
        const rsaSeq = readTLV(der, bsTLV.vs + 1);
        const modTLV = readTLV(der, rsaSeq.vs);
        let modLen = modTLV.length;
        if (der[modTLV.vs] === 0x00) modLen--;
        keyInfo = 'RSA-' + (modLen * 8);
      } catch(e) { keyInfo = 'RSA'; }
    } else if (pkiOid === '1.2.840.10045.2.1') { // EC
      if (pkiOidTLV.end < pkiAlgSeq.end) {
        const curveTLV = readTLV(der, pkiOidTLV.end);
        if (curveTLV.tag === 0x06) {
          const curveOid = parseOID(der, curveTLV.vs, curveTLV.length);
          keyInfo = OID_MAP[curveOid] || ('EC(' + curveOid + ')');
        }
      }
    }
    offset = tlv.end;

    // Extensions [3] EXPLICIT (optional)
    const sans = [];
    while (offset < tbsSeq.end) {
      const ext = readTLV(der, offset);
      if (ext.tag === 0xA3) {
        const extsSeq = readTLV(der, ext.vs);
        let eo = extsSeq.vs;
        while (eo < extsSeq.end) {
          const extSeq = readTLV(der, eo);
          const extOidTLV = readTLV(der, extSeq.vs);
          if (extOidTLV.tag === 0x06) {
            const extOid = parseOID(der, extOidTLV.vs, extOidTLV.length);
            if (extOid === '2.5.29.17') { // SAN
              let p = extOidTLV.end;
              let nextTLV = readTLV(der, p);
              if (nextTLV.tag === 0x01) { p = nextTLV.end; nextTLV = readTLV(der, p); }
              // nextTLV is OCTET STRING wrapping the SAN SEQUENCE
              try { sans.push(...parseSAN(der, nextTLV.vs, nextTLV.length)); } catch(e) {}
            }
          }
          eo = extSeq.end;
        }
      }
      offset = ext.end;
    }

    return { serial, sigAlg, issuer, notBefore, notAfter, subject, keyInfo, sans };
  }

  function extractPem(text) {
    const m = text.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/);
    if (!m) return null;
    return m[0].replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '');
  }

  function daysBetween(dateStr, now) {
    // dateStr: "YYYY-MM-DD HH:MM:SSZ"
    const y = parseInt(dateStr.slice(0,4)), mo = parseInt(dateStr.slice(5,7))-1;
    const d = parseInt(dateStr.slice(8,10)), h = parseInt(dateStr.slice(11,13));
    const mi = parseInt(dateStr.slice(14,16)), s = parseInt(dateStr.slice(17,19));
    const then = new Date(Date.UTC(y, mo, d, h, mi, s));
    return Math.floor((then - now) / 86400000);
  }

  // === cert_decode ===

  const cert_decode = new Command({
    name: "cert_decode",
    parameters: [],
    type: "insert",
    helpText: "Decode an X.509 PEM certificate in the note. Paste the full PEM block into the note, then run cert_decode().",
    tutorials: [
      new TutorialCommand({command: "cert_decode()", description: "Decode the PEM certificate in this note"})
    ],
    extension: extensionRoot
  });
  cert_decode.execute = function(payload) {
    const b64 = extractPem(payload.fullText || '');
    if (!b64) return new ReturnObject({status: "error", message: "No PEM certificate found in note. Paste a -----BEGIN CERTIFICATE----- block first."});
    let cert;
    try {
      const der = b64decode(b64);
      cert = parseCert(der);
    } catch(e) {
      return new ReturnObject({status: "error", message: "Failed to parse certificate: " + e.message});
    }
    const lines = [
      'Subject : ' + rdnToString(cert.subject),
      'Issuer  : ' + rdnToString(cert.issuer),
      'Valid   : ' + cert.notBefore + '  →  ' + cert.notAfter,
      'Key     : ' + cert.keyInfo,
      'Sig     : ' + cert.sigAlg,
      'Serial  : ' + cert.serial,
    ];
    if (cert.sans.length > 0) {
      lines.push('SAN     : ' + cert.sans.join(', '));
    }
    return new ReturnObject({status: "success", message: "Certificate decoded.", payload: lines.join('\n')});
  };

  // === cert_days ===

  const cert_days = new Command({
    name: "cert_days",
    parameters: [],
    type: "insert",
    helpText: "Calculate days until a PEM certificate in the note expires. Paste the full PEM block into the note, then run cert_days().",
    tutorials: [
      new TutorialCommand({command: "cert_days()", description: "Show days until the certificate in this note expires"})
    ],
    extension: extensionRoot
  });
  cert_days.execute = function(payload) {
    const b64 = extractPem(payload.fullText || '');
    if (!b64) return new ReturnObject({status: "error", message: "No PEM certificate found in note. Paste a -----BEGIN CERTIFICATE----- block first."});
    let cert;
    try {
      const der = b64decode(b64);
      cert = parseCert(der);
    } catch(e) {
      return new ReturnObject({status: "error", message: "Failed to parse certificate: " + e.message});
    }
    const now = new Date();
    const days = daysBetween(cert.notAfter, now);
    let status;
    if (days < 0) status = 'EXPIRED ' + Math.abs(days) + ' days ago';
    else if (days === 0) status = 'EXPIRES TODAY';
    else if (days <= 7) status = days + ' days remaining  [CRITICAL]';
    else if (days <= 30) status = days + ' days remaining  [WARNING]';
    else status = days + ' days remaining';
    return new ReturnObject({
      status: "success",
      message: "",
      payload: status + '  (expires ' + cert.notAfter.slice(0,10) + ')'
    });
  };

})();
