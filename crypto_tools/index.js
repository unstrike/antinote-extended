(function() {
  const extensionName = "crypto_tools";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.1.0",
    author: "unstrike",
    endpoints: [],
    requiredAPIKeys: [],
    category: "Utilities",
    dataScope: "none"
  });

  function rndBytes(n) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return Array.from(crypto.getRandomValues(new Uint8Array(n)));
    }
    const b = [];
    for (let i = 0; i < n; i++) b.push(Math.floor(Math.random() * 256));
    return b;
  }

  function toHex(bytes) {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function toB64(bytes) {
    const T = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i], b1 = bytes[i+1] || 0, b2 = bytes[i+2] || 0;
      out += T[b0 >> 2];
      out += T[((b0 & 3) << 4) | (b1 >> 4)];
      out += i+1 < bytes.length ? T[((b1 & 15) << 2) | (b2 >> 6)] : '=';
      out += i+2 < bytes.length ? T[b2 & 63] : '=';
    }
    return out;
  }

  const CHARSETS = {
    alpha:        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alphanumeric: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    numeric:      '0123456789',
    hex:          '0123456789abcdef',
    full:         'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  // --- uuid_gen ---

  const uuid_gen = new Command({
    name: "uuid_gen",
    parameters: [],
    type: "insert",
    helpText: "Generate a UUID v4.",
    tutorials: [
      new TutorialCommand({command: "uuid_gen()", description: "Insert a random UUID v4"})
    ],
    extension: extensionRoot
  });
  uuid_gen.execute = function(payload) {
    const b = rndBytes(16);
    b[6] = (b[6] & 0x0F) | 0x40;
    b[8] = (b[8] & 0x3F) | 0x80;
    const h = toHex(b);
    const uuid = h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
    return new ReturnObject({status: "success", message: "UUID generated.", payload: uuid});
  };

  // --- rand_hex ---

  const rand_hex = new Command({
    name: "rand_hex",
    parameters: [
      new Parameter({type: "int", name: "n", helpText: "Number of bytes", default: "16"})
    ],
    type: "insert",
    helpText: "Generate n random bytes as a hex string.",
    tutorials: [
      new TutorialCommand({command: "rand_hex(16)", description: "32-char hex string (16 bytes)"}),
      new TutorialCommand({command: "rand_hex(32)", description: "64-char hex string (32 bytes)"})
    ],
    extension: extensionRoot
  });
  rand_hex.execute = function(payload) {
    const [n] = this.getParsedParams(payload);
    const count = parseInt(n, 10);
    if (isNaN(count) || count < 1 || count > 1024)
      return new ReturnObject({status: "error", message: "n must be 1–1024."});
    return new ReturnObject({status: "success", message: "Random hex generated.", payload: toHex(rndBytes(count))});
  };

  // --- rand_b64 ---

  const rand_b64 = new Command({
    name: "rand_b64",
    parameters: [
      new Parameter({type: "int", name: "n", helpText: "Number of bytes", default: "16"})
    ],
    type: "insert",
    helpText: "Generate n random bytes as a base64 string.",
    tutorials: [
      new TutorialCommand({command: "rand_b64(16)", description: "~24-char base64 (16 bytes)"}),
      new TutorialCommand({command: "rand_b64(32)", description: "~44-char base64 (32 bytes)"})
    ],
    extension: extensionRoot
  });
  rand_b64.execute = function(payload) {
    const [n] = this.getParsedParams(payload);
    const count = parseInt(n, 10);
    if (isNaN(count) || count < 1 || count > 1024)
      return new ReturnObject({status: "error", message: "n must be 1–1024."});
    return new ReturnObject({status: "success", message: "Random base64 generated.", payload: toB64(rndBytes(count))});
  };

  // --- password_gen ---

  const password_gen = new Command({
    name: "password_gen",
    parameters: [
      new Parameter({type: "int", name: "len", helpText: "Password length", default: "16"}),
      new Parameter({type: "string", name: "charset", helpText: "Preset: alpha / alphanumeric / numeric / hex / full — or custom chars", default: "full", required: false})
    ],
    type: "insert",
    helpText: "Generate a random password. Charset presets: alpha, alphanumeric, numeric, hex, full (default).",
    tutorials: [
      new TutorialCommand({command: "password_gen(20)", description: "20-char full-charset password"}),
      new TutorialCommand({command: "password_gen(16, alphanumeric)", description: "16-char alphanumeric password"}),
      new TutorialCommand({command: "password_gen(12, alpha)", description: "12 random letters"}),
      new TutorialCommand({command: "password_gen(8, ABC123!@#)", description: "8 chars from custom set"})
    ],
    extension: extensionRoot
  });
  password_gen.execute = function(payload) {
    const [len, charset] = this.getParsedParams(payload);
    const length = parseInt(len, 10);
    if (isNaN(length) || length < 1 || length > 512)
      return new ReturnObject({status: "error", message: "Length must be 1–512."});
    const cs = (charset || 'full').trim();
    const chars = CHARSETS[cs] || cs;
    if (!chars || chars.length < 2)
      return new ReturnObject({status: "error", message: "Charset must have at least 2 characters."});
    const bytes = rndBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
    return new ReturnObject({status: "success", message: "Password generated.", payload: out});
  };

})();
