# Antinote Extensions — Claude Reference

Extensions live in this directory. Each extension is a subfolder with `index.js` + `extension.json`.

Use `/new-antinote-extension` to scaffold a new extension interactively.

---

## File Structure

```
my_extension/
  index.js          ← required, IIFE-wrapped
  extension.json    ← required metadata
```

Multi-file (>500 lines): add `helpers/`, `commands/` subfolders and list all files in `extension.json` under `"files"` (index.js must be first).

---

## index.js Skeleton

```js
(function() {
  const extensionName = "my_extension";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [],          // ["https://api.example.com"] if network
    requiredAPIKeys: [],    // ["apikey_xxx"] if network auth needed
    author: "unstrike",
    category: "Utilities",
    dataScope: "none",      // "none" | "line" | "full"
    dependencies: [],       // ["ai_providers"] if using AI
    isService: false
  });

  const my_command = new Command({
    name: "my_command",
    parameters: [
      new Parameter({type: "string", name: "text", helpText: "Input text", default: "hello"})
    ],
    type: "insert",         // "insert" | "replaceLine" | "replaceAll" | "openURL"
    helpText: "Does something useful.",
    tutorials: [
      new TutorialCommand({command: "my_command(hello)", description: "Basic usage"})
    ],
    extension: extensionRoot
  });

  my_command.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (!text) return new ReturnObject({status: "error", message: "Text required."});
    return new ReturnObject({status: "success", message: "Done.", payload: text.toUpperCase()});
  };

})();
```

---

## extension.json

```json
{
  "name": "my_extension",
  "version": "1.0.0",
  "author": "unstrike",
  "category": "Utilities",
  "dataScope": "none",
  "endpoints": [],
  "requiredAPIKeys": [],
  "commands": ["my_command"]
}
```

Multi-file: add `"files": ["index.js", "helpers/foo.js", "commands/bar.js"]`

---

## Quick Reference

### Parameter types
`"string"` `"int"` `"float"` `"bool"` `"paragraph"` `"expression"` `"mathExpression"`

Make optional: `required: false` (uses `default` when omitted)

### Command types
| Type | Effect |
|------|--------|
| `"insert"` | Appends result after command |
| `"replaceLine"` | Replaces current line |
| `"replaceAll"` | Replaces entire note |
| `"openURL"` | Opens URL in browser |

### dataScope
- `"none"` — no note content (generators, calculators, converters)
- `"line"` — current line only
- `"full"` — entire note (search/replace, analysis)

### payload object
```js
{
  parameters: ["val1", "val2"],  // raw strings
  fullText: "",                   // based on dataScope
  userSettings: { decimalSeparator: ".", thousandsSeparator: "," }
}
```

---

## Network Calls (callAPI)

Declare endpoints + API keys in Extension constructor, then:

```js
const result = callAPI("apikey_weather", `https://api.example.com/data?key={{API_KEY}}&q=Boston`, "GET", JSON.stringify({}), "");
if (!result.success) return new ReturnObject({status: "error", message: result.error});
const data = JSON.parse(result.data);
```

`{{API_KEY}}` is replaced by Swift with the stored keychain value.

---

## AI (callAIProvider)

Declare `dependencies: ["ai_providers"]`, then:

```js
if (typeof callAIProvider === 'undefined')
  return new ReturnObject({status: "error", message: "AI Providers service not available."});

const result = callAIProvider(payload.fullText, {
  systemPrompt: "Summarize concisely.",
  maxTokens: 200,
  temperature: 0.7
});
return result; // already a ReturnObject
```

---

## Math Expressions (MathEvaluator)

```js
const parseNumeric = (typeof MathEvaluator !== 'undefined')
  ? (v) => MathEvaluator.parseNumeric(v)
  : (v) => parseFloat(v);

const rate = parseNumeric(params[0]);  // accepts "0.05/12" or 0.00416667
```

Methods: `MathEvaluator.eval(expr)` · `evalSafe(expr, default)` · `isMathExpression(str)` · `parseNumeric(val)`

---

## Patterns & Rules

- Always wrap in IIFE `(function() { ... })()`
- Always validate inputs, return clear error messages
- Always return `ReturnObject` (never throw / return raw values)
- Use minimum required `dataScope`
- `extension.json` commands array must match defined Command names exactly
- No `require()` / `import` — ES6 only, no Node.js builtins

---

## Sync Note

**DO NOT stow this package** — Antinote does not follow symlinks and will silently ignore stowed extension directories.

To sync to a new machine, copy directly:
```zsh
cp -r ~/dotfiles/antinote-extensions/* "/path/to/Antinote/Extensions/"
```

Tests live in `~/dotfiles/antinote-extensions/test.js` (not here — Antinote deletes unrecognised files).
Run with: `node ~/dotfiles/antinote-extensions/test.js`
