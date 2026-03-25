(function() {
  const extensionName = "json";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Utilities",
    dataScope: "full"
  });

  // Resolve a dot/bracket path against an object.
  // Supports: .key  .key.sub  [n]  .key[n].sub  . (root)
  function getByPath(obj, path) {
    const trimmed = path.trim();
    if (trimmed === '' || trimmed === '.') return obj;
    const tokens = trimmed
      .replace(/\[(\d+)\]/g, '.$1')
      .replace(/^\./, '')
      .split('.')
      .filter(Boolean);
    return tokens.reduce((curr, key) => {
      if (curr === null || curr === undefined) return undefined;
      return curr[key];
    }, obj);
  }

  // === json_validate ===
  const json_validate = new Command({
    name: "json_validate",
    parameters: [],
    type: "insert",
    helpText: "Validate the JSON in the current note. Reports structure info or parse error.",
    tutorials: [
      new TutorialCommand({command:'json_validate()',description:"Validate JSON in note"})
    ],
    extension: extensionRoot
  });
  json_validate.execute = function(payload) {
    const text = (payload.fullText || '').trim();
    if (!text) return new ReturnObject({status:"error",message:"Note is empty."});
    try {
      const parsed = JSON.parse(text);
      const isArr = Array.isArray(parsed);
      const type = isArr ? 'array' : typeof parsed;
      const detail = isArr
        ? parsed.length + ' items'
        : (type === 'object' ? Object.keys(parsed).length + ' keys' : '');
      const summary = 'Valid JSON (' + type + (detail ? ', ' + detail : '') + ')';
      return new ReturnObject({status:"success",message:"JSON is valid.",payload:summary});
    } catch(e) {
      return new ReturnObject({status:"error",message:"Invalid JSON: " + e.message});
    }
  };

  // === json_extract ===
  const json_extract = new Command({
    name: "json_extract",
    parameters: [
      new Parameter({type:"string",name:"path",helpText:"Dot/bracket path: . (root), .key, .key.sub, .arr[0], .arr[0].field",default:"."})
    ],
    type: "insert",
    helpText: "Extract a value from the JSON note by path. Objects/arrays are pretty-printed.",
    tutorials: [
      new TutorialCommand({command:'json_extract(".")',description:"Return the root (re-inserts full JSON)"}),
      new TutorialCommand({command:'json_extract(".name")',description:"Get top-level name field"}),
      new TutorialCommand({command:'json_extract(".users[0].email")',description:"Get first user's email"})
    ],
    extension: extensionRoot
  });
  json_extract.execute = function(payload) {
    const [path] = this.getParsedParams(payload);
    const text = (payload.fullText || '').trim();
    if (!text) return new ReturnObject({status:"error",message:"Note is empty."});
    if (path === undefined || path === null) return new ReturnObject({status:"error",message:"Provide a path."});
    try {
      const parsed = JSON.parse(text);
      const value = getByPath(parsed, String(path));
      if (value === undefined) return new ReturnObject({status:"error",message:"Path '" + path + "' not found."});
      const out = (typeof value === 'object' && value !== null)
        ? JSON.stringify(value, null, 2)
        : String(value);
      return new ReturnObject({status:"success",message:"Value extracted.",payload:out});
    } catch(e) {
      return new ReturnObject({status:"error",message:"Error: " + e.message});
    }
  };

})();
