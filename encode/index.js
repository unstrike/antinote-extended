(function() {
  const extensionName = "encode";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Utilities",
    dataScope: "none"
  });

  // === Base64 ===

  const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  function b64Encode(str) {
    // Convert to UTF-8 byte string
    const bytes = unescape(encodeURIComponent(str));
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes.charCodeAt(i);
      const b1 = i + 1 < bytes.length ? bytes.charCodeAt(i + 1) : 0;
      const b2 = i + 2 < bytes.length ? bytes.charCodeAt(i + 2) : 0;
      out += B64_CHARS[b0 >> 2];
      out += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
      out += i + 1 < bytes.length ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
      out += i + 2 < bytes.length ? B64_CHARS[b2 & 63] : '=';
    }
    return out;
  }

  function b64Decode(str) {
    const clean = str.replace(/\s/g, '');
    const lookup = {};
    for (let i = 0; i < B64_CHARS.length; i++) lookup[B64_CHARS[i]] = i;
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
      return bytes; // fallback for non-UTF-8 content
    }
  }

  // === HTML entities ===

  const HTML_ENCODE_MAP = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
  const HTML_DECODE_MAP = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'"};

  function htmlEncode(str) {
    return str.replace(/[&<>"']/g, ch => HTML_ENCODE_MAP[ch]);
  }

  function htmlDecode(str) {
    return str
      .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, entity => HTML_DECODE_MAP[entity])
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  // === Commands ===

  const b64_encode = new Command({
    name: "b64_encode",
    parameters: [
      new Parameter({type: "string", name: "text", helpText: "Text to encode", default: "Hello World"})
    ],
    type: "replaceLine",
    helpText: "Base64-encode the given text.",
    tutorials: [
      new TutorialCommand({command: 'b64_encode("Hello World")', description: "Encode 'Hello World'"}),
      new TutorialCommand({command: 'b64_encode("user:password")', description: "Encode credentials"})
    ],
    extension: extensionRoot
  });

  b64_encode.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) {
      return new ReturnObject({status: "error", message: "Please provide text to encode."});
    }
    return new ReturnObject({status: "success", message: "Base64 encoded.", payload: b64Encode(String(text))});
  };

  const b64_decode = new Command({
    name: "b64_decode",
    parameters: [
      new Parameter({type: "string", name: "text", helpText: "Base64 string to decode", default: "SGVsbG8gV29ybGQ="})
    ],
    type: "replaceLine",
    helpText: "Decode a Base64-encoded string.",
    tutorials: [
      new TutorialCommand({command: 'b64_decode("SGVsbG8gV29ybGQ=")', description: "Decode 'Hello World'"}),
      new TutorialCommand({command: 'b64_decode("dXNlcjpwYXNzd29yZA==")', description: "Decode credentials"})
    ],
    extension: extensionRoot
  });

  b64_decode.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (!text || !text.trim()) {
      return new ReturnObject({status: "error", message: "Please provide a Base64 string to decode."});
    }
    try {
      const result = b64Decode(String(text).trim());
      return new ReturnObject({status: "success", message: "Base64 decoded.", payload: result});
    } catch (e) {
      return new ReturnObject({status: "error", message: "Invalid Base64 string."});
    }
  };

  const url_encode = new Command({
    name: "url_encode",
    parameters: [
      new Parameter({type: "string", name: "text", helpText: "Text to URL-encode", default: "hello world & more"})
    ],
    type: "replaceLine",
    helpText: "URL-encode (percent-encode) the given text.",
    tutorials: [
      new TutorialCommand({command: 'url_encode("hello world")', description: "Encode spaces and special chars"}),
      new TutorialCommand({command: 'url_encode("a=1&b=2")', description: "Encode query string characters"})
    ],
    extension: extensionRoot
  });

  url_encode.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) {
      return new ReturnObject({status: "error", message: "Please provide text to encode."});
    }
    return new ReturnObject({status: "success", message: "URL encoded.", payload: encodeURIComponent(String(text))});
  };

  const url_decode = new Command({
    name: "url_decode",
    parameters: [
      new Parameter({type: "string", name: "text", helpText: "URL-encoded string to decode", default: "hello%20world"})
    ],
    type: "replaceLine",
    helpText: "Decode a URL percent-encoded string.",
    tutorials: [
      new TutorialCommand({command: 'url_decode("hello%20world")', description: "Decode %20 spaces"}),
      new TutorialCommand({command: 'url_decode("a%3D1%26b%3D2")', description: "Decode query string"})
    ],
    extension: extensionRoot
  });

  url_decode.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (!text || !text.trim()) {
      return new ReturnObject({status: "error", message: "Please provide a URL-encoded string to decode."});
    }
    try {
      return new ReturnObject({status: "success", message: "URL decoded.", payload: decodeURIComponent(String(text).trim())});
    } catch (e) {
      return new ReturnObject({status: "error", message: "Invalid URL-encoded string."});
    }
  };

  const html_encode = new Command({
    name: "html_encode",
    parameters: [
      new Parameter({type: "string", name: "text", helpText: "Text to HTML-encode", default: '<a href="#">link</a>'})
    ],
    type: "replaceLine",
    helpText: "Encode HTML special characters (&, <, >, \", ').",
    tutorials: [
      new TutorialCommand({command: 'html_encode("<b>bold</b>")', description: "Escape HTML tags"}),
      new TutorialCommand({command: 'html_encode("AT&T")', description: "Escape ampersand"})
    ],
    extension: extensionRoot
  });

  html_encode.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) {
      return new ReturnObject({status: "error", message: "Please provide text to encode."});
    }
    return new ReturnObject({status: "success", message: "HTML encoded.", payload: htmlEncode(String(text))});
  };

  const html_decode = new Command({
    name: "html_decode",
    parameters: [
      new Parameter({type: "string", name: "text", helpText: "HTML-encoded string to decode", default: "&lt;b&gt;bold&lt;/b&gt;"})
    ],
    type: "replaceLine",
    helpText: "Decode HTML entities back to plain text.",
    tutorials: [
      new TutorialCommand({command: 'html_decode("&lt;b&gt;bold&lt;/b&gt;")', description: "Decode HTML tags"}),
      new TutorialCommand({command: 'html_decode("AT&amp;T")', description: "Decode &amp;"})
    ],
    extension: extensionRoot
  });

  html_decode.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (!text || !text.trim()) {
      return new ReturnObject({status: "error", message: "Please provide an HTML-encoded string to decode."});
    }
    return new ReturnObject({status: "success", message: "HTML decoded.", payload: htmlDecode(String(text))});
  };

})();
