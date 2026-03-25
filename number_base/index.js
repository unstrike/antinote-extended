(function() {
  const extensionName = "number_base";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Utilities",
    dataScope: "none"
  });

  const to_hex = new Command({
    name: "to_hex",
    parameters: [
      new Parameter({type: "string", name: "input", helpText: "Decimal integer", default: "255"})
    ],
    type: "replaceLine",
    helpText: "Convert a decimal integer to hexadecimal.",
    tutorials: [
      new TutorialCommand({command: "to_hex(255)", description: "255 → 0xFF"}),
      new TutorialCommand({command: "to_hex(65535)", description: "65535 → 0xFFFF"})
    ],
    extension: extensionRoot
  });
  to_hex.execute = function(payload) {
    const [input] = this.getParsedParams(payload);
    const n = parseInt(input, 10);
    if (isNaN(n)) return new ReturnObject({status: "error", message: "Not a decimal integer: " + input});
    return new ReturnObject({status: "success", message: "", payload: "0x" + n.toString(16).toUpperCase()});
  };

  const to_bin = new Command({
    name: "to_bin",
    parameters: [
      new Parameter({type: "string", name: "input", helpText: "Decimal integer", default: "255"})
    ],
    type: "replaceLine",
    helpText: "Convert a decimal integer to binary.",
    tutorials: [
      new TutorialCommand({command: "to_bin(255)", description: "255 → 0b11111111"}),
      new TutorialCommand({command: "to_bin(10)", description: "10 → 0b1010"})
    ],
    extension: extensionRoot
  });
  to_bin.execute = function(payload) {
    const [input] = this.getParsedParams(payload);
    const n = parseInt(input, 10);
    if (isNaN(n)) return new ReturnObject({status: "error", message: "Not a decimal integer: " + input});
    return new ReturnObject({status: "success", message: "", payload: "0b" + n.toString(2)});
  };

  const to_oct = new Command({
    name: "to_oct",
    parameters: [
      new Parameter({type: "string", name: "input", helpText: "Decimal integer", default: "255"})
    ],
    type: "replaceLine",
    helpText: "Convert a decimal integer to octal.",
    tutorials: [
      new TutorialCommand({command: "to_oct(255)", description: "255 → 0o377"}),
      new TutorialCommand({command: "to_oct(8)", description: "8 → 0o10"})
    ],
    extension: extensionRoot
  });
  to_oct.execute = function(payload) {
    const [input] = this.getParsedParams(payload);
    const n = parseInt(input, 10);
    if (isNaN(n)) return new ReturnObject({status: "error", message: "Not a decimal integer: " + input});
    return new ReturnObject({status: "success", message: "", payload: "0o" + n.toString(8)});
  };

  const to_dec = new Command({
    name: "to_dec",
    parameters: [
      new Parameter({type: "string", name: "input", helpText: "Number to convert", default: "FF"}),
      new Parameter({type: "int", name: "from_base", helpText: "Source base (2–36)", default: "16"})
    ],
    type: "replaceLine",
    helpText: "Convert a number from any base (2–36) to decimal.",
    tutorials: [
      new TutorialCommand({command: "to_dec(FF, 16)", description: "Hex FF → 255"}),
      new TutorialCommand({command: "to_dec(11111111, 2)", description: "Binary 11111111 → 255"}),
      new TutorialCommand({command: "to_dec(377, 8)", description: "Octal 377 → 255"})
    ],
    extension: extensionRoot
  });
  to_dec.execute = function(payload) {
    const [input, fromBase] = this.getParsedParams(payload);
    const base = parseInt(fromBase, 10);
    if (isNaN(base) || base < 2 || base > 36)
      return new ReturnObject({status: "error", message: "Base must be 2–36."});
    const stripped = input.trim().replace(/^0[xXbBoO]/, '');
    const n = parseInt(stripped, base);
    if (isNaN(n)) return new ReturnObject({status: "error", message: "Invalid number for base " + base + ": " + input});
    return new ReturnObject({status: "success", message: "", payload: String(n)});
  };

  const byte_size = new Command({
    name: "byte_size",
    parameters: [
      new Parameter({type: "string", name: "input", helpText: "Text to measure", default: "hello"})
    ],
    type: "replaceLine",
    helpText: "UTF-8 byte size of a string.",
    tutorials: [
      new TutorialCommand({command: "byte_size(hello)", description: "5 bytes, 5 chars"}),
      new TutorialCommand({command: "byte_size(café)", description: "5 bytes, 4 chars (é = 2 bytes)"})
    ],
    extension: extensionRoot
  });
  byte_size.execute = function(payload) {
    const [input] = this.getParsedParams(payload);
    let bytes = 0;
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF) { bytes += 4; i++; }
      else if (c < 0x80) bytes += 1;
      else if (c < 0x800) bytes += 2;
      else bytes += 3;
    }
    return new ReturnObject({status: "success", message: "", payload: bytes + " bytes, " + input.length + " chars"});
  };

})();
