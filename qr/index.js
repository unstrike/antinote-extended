(function() {
  const extensionName = "qr";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Utilities",
    dataScope: "none"
  });

  function buildQRUrl(text, size) {
    const px = Math.min(Math.max(parseInt(size) || 300, 50), 1000);
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text.trim())}&size=${px}x${px}`;
  }

  // 1. qr — open QR code image in browser
  const qr = new Command({
    name: "qr",
    parameters: [
      new Parameter({type: "string", name: "text", helpText: "Text or URL to encode", default: "https://example.com"}),
      new Parameter({type: "int", name: "size", helpText: "Image size in pixels (50–1000)", default: 300, required: false})
    ],
    type: "openURL",
    helpText: "Generate and open a QR code for any text or URL.",
    tutorials: [
      new TutorialCommand({command: 'qr("https://example.com")', description: "QR code for a URL"}),
      new TutorialCommand({command: 'qr("Hello World")', description: "QR code for plain text"}),
      new TutorialCommand({command: 'qr("https://example.com", 500)', description: "QR code at 500px"})
    ],
    extension: extensionRoot
  });

  qr.execute = function(payload) {
    const [text, size] = this.getParsedParams(payload);
    if (!text || !text.trim()) {
      return new ReturnObject({status: "error", message: "Please provide text or a URL to encode."});
    }
    return new ReturnObject({status: "success", message: "Opening QR code.", payload: buildQRUrl(text, size || 300)});
  };

  // 2. qr_url — insert the QR image URL into the note
  const qr_url = new Command({
    name: "qr_url",
    parameters: [
      new Parameter({type: "string", name: "text", helpText: "Text or URL to encode", default: "https://example.com"}),
      new Parameter({type: "int", name: "size", helpText: "Image size in pixels (50–1000)", default: 300, required: false})
    ],
    type: "insert",
    helpText: "Insert the QR code image URL into the note.",
    tutorials: [
      new TutorialCommand({command: 'qr_url("https://example.com")', description: "Insert QR image URL"}),
      new TutorialCommand({command: 'qr_url("contact info", 200)', description: "Insert QR URL at 200px"})
    ],
    extension: extensionRoot
  });

  qr_url.execute = function(payload) {
    const [text, size] = this.getParsedParams(payload);
    if (!text || !text.trim()) {
      return new ReturnObject({status: "error", message: "Please provide text or a URL to encode."});
    }
    return new ReturnObject({status: "success", message: "QR URL inserted.", payload: buildQRUrl(text, size || 300)});
  };

})();
