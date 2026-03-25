(function() {
  const extensionName = "jwt";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Utilities",
    dataScope: "none"
  });

  // === Base64url decode ===

  const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  function base64urlDecode(str) {
    // base64url → base64
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';

    const lookup = {};
    for (let i = 0; i < B64_CHARS.length; i++) lookup[B64_CHARS[i]] = i;

    const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
    let bytes = '';
    for (let i = 0; i < clean.length; i += 4) {
      const e0 = lookup[clean[i]]     || 0;
      const e1 = lookup[clean[i + 1]] || 0;
      const e2 = clean[i + 2] === '=' ? 0 : (lookup[clean[i + 2]] || 0);
      const e3 = clean[i + 3] === '=' ? 0 : (lookup[clean[i + 3]] || 0);
      bytes += String.fromCharCode((e0 << 2) | (e1 >> 4));
      if (clean[i + 2] !== '=') bytes += String.fromCharCode(((e1 & 15) << 4) | (e2 >> 2));
      if (clean[i + 3] !== '=') bytes += String.fromCharCode(((e2 & 3) << 6) | e3);
    }
    try {
      return decodeURIComponent(escape(bytes));
    } catch (e) {
      return bytes;
    }
  }

  function decodeJWT(token) {
    const parts = token.trim().split('.');
    if (parts.length < 2 || parts.length > 3) {
      throw new Error('Expected 2 or 3 dot-separated parts');
    }
    const header  = JSON.parse(base64urlDecode(parts[0]));
    const payload = JSON.parse(base64urlDecode(parts[1]));
    return { header, payload, signed: parts.length === 3 };
  }

  function formatExpiry(exp) {
    const expMs   = exp * 1000;
    const now     = Date.now();
    const expired = expMs < now;
    const diff    = Math.abs(expMs - now);
    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const mins    = Math.floor((diff % 3600000) / 60000);

    let relative;
    if (days > 0)       relative = `${days}d ${hours}h`;
    else if (hours > 0) relative = `${hours}h ${mins}m`;
    else                relative = `${mins}m`;

    const status = expired ? `EXPIRED ${relative} ago` : `valid for ${relative}`;
    return `${new Date(expMs).toISOString()}  (${status})`;
  }

  // === Commands ===

  // 1. jwt_decode — full header + payload decode
  const jwt_decode = new Command({
    name: "jwt_decode",
    parameters: [
      new Parameter({type: "string", name: "token", helpText: "JWT token to decode", default: "eyJ..."})
    ],
    type: "insert",
    helpText: "Decode a JWT and insert the header, payload, and expiry. Does not verify the signature.",
    tutorials: [
      new TutorialCommand({command: 'jwt_decode("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxOTE2MjM5MDIyfQ.sig")', description: "Decode a JWT token"})
    ],
    extension: extensionRoot
  });

  jwt_decode.execute = function(payload) {
    const [token] = this.getParsedParams(payload);
    if (!token || !token.trim()) {
      return new ReturnObject({status: "error", message: "Please provide a JWT token."});
    }
    try {
      const { header, payload: claims, signed } = decodeJWT(token.trim());

      const lines = [
        '── Header ──',
        JSON.stringify(header, null, 2),
        '── Payload ──',
        JSON.stringify(claims, null, 2)
      ];

      if (claims.exp !== undefined) {
        lines.push('── Expiry ──');
        lines.push(formatExpiry(claims.exp));
      }
      if (claims.iat) {
        lines.push('── Issued ──');
        lines.push(new Date(claims.iat * 1000).toISOString());
      }
      if (!signed) {
        lines.push('── Note: unsigned token (no signature) ──');
      }

      return new ReturnObject({status: "success", message: "JWT decoded.", payload: lines.join('\n')});
    } catch (e) {
      return new ReturnObject({status: "error", message: `Failed to decode JWT: ${e.message}`});
    }
  };

  // 2. jwt_exp — quick expiry check, one line
  const jwt_exp = new Command({
    name: "jwt_exp",
    parameters: [
      new Parameter({type: "string", name: "token", helpText: "JWT token to check expiry", default: "eyJ..."})
    ],
    type: "replaceLine",
    helpText: "Show a JWT's expiry time and whether it is still valid.",
    tutorials: [
      new TutorialCommand({command: 'jwt_exp("eyJ...")', description: "Check if a JWT is expired"})
    ],
    extension: extensionRoot
  });

  jwt_exp.execute = function(payload) {
    const [token] = this.getParsedParams(payload);
    if (!token || !token.trim()) {
      return new ReturnObject({status: "error", message: "Please provide a JWT token."});
    }
    try {
      const { payload: claims } = decodeJWT(token.trim());
      if (claims.exp === undefined) {
        return new ReturnObject({status: "success", message: "No exp claim.", payload: "No exp claim in token"});
      }
      return new ReturnObject({status: "success", message: "JWT expiry checked.", payload: formatExpiry(claims.exp)});
    } catch (e) {
      return new ReturnObject({status: "error", message: `Failed to decode JWT: ${e.message}`});
    }
  };

})();
