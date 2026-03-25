#!/usr/bin/env node
// Antinote Extensions — Test Runner
// Run: node test.js
//
// NOTE — ::jwt autocomplete xcrun error:
//   Typing "::jwt" shows an error ":xcrun: error: cannot be used within an App
//   Sandbox." This is an Antinote app bug: the autocomplete preview spawns
//   `xcrun jsc` (JavaScriptCore CLI) which the App Sandbox blocks. Selecting
//   individual commands works because they run in the embedded JSC runtime.
//   This is NOT caused by the extension code and cannot be fixed here.

'use strict';

const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

// ─── Harness ─────────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

function ok(label, condition, got) {
  if (condition) {
    process.stdout.write(`  \x1b[32m✓\x1b[0m ${label}\n`);
    passed++;
  } else {
    process.stdout.write(`  \x1b[31m✗\x1b[0m ${label}  →  ${JSON.stringify(got)}\n`);
    failed++;
  }
}

function section(name) {
  process.stdout.write(`\n\x1b[1m${name}\x1b[0m\n`);
}

function p(parameters = [], fullText = '', extra = {}) {
  return { parameters, fullText, userSettings: { decimalSeparator: '.', thousandsSeparator: ',' }, ...extra };
}

// ─── Runtime Mock ─────────────────────────────────────────────────────────────

function loadExtension(name) {
  const dir  = path.join(__dirname, name);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'extension.json'), 'utf8'));
  const files = meta.files || ['index.js'];

  let src = '';
  for (const f of files) src += fs.readFileSync(path.join(dir, f), 'utf8') + '\n';

  const cmds = {};

  class ReturnObject {
    constructor({ status, message, payload: pl }) {
      this.status  = status;
      this.message = message !== undefined ? message : '';
      this.payload = pl !== undefined ? pl : '';
    }
  }

  class Extension {
    constructor(o) { Object.assign(this, o); }
    register_preference() {}
  }
  class Parameter       { constructor(o) { Object.assign(this, o); } }
  class TutorialCommand { constructor(o) { Object.assign(this, o); } }
  class Preference      { constructor(o) { Object.assign(this, o); } }

  class Command {
    constructor(opts) {
      Object.assign(this, opts);
      cmds[opts.name] = this;
    }
    getParsedParams(payload) {
      const raw = payload.parameters || [];
      const defs = this.parameters || [];
      return defs.map((def, i) => {
        const v = raw[i];
        if (i >= raw.length) return def.default;
        if (def.type === 'bool') return v === 'true' || v === true;
        if (def.type === 'int') return parseInt(v, 10);
        if (def.type === 'float') return parseFloat(v);
        return v;
      });
    }
  }

  vm.runInNewContext(src, {
    Extension, Command, Parameter, ReturnObject, TutorialCommand, Preference,
    Date, Math, Number, String, Boolean, Array, Object, JSON, BigInt,
    parseInt, parseFloat, isNaN, isFinite,
    encodeURIComponent, decodeURIComponent, escape, unescape,
    RegExp, Error, TypeError, RangeError, SyntaxError,
    Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array,
    Float32Array, Float64Array, Map, Set, Symbol,
    Intl, console,
    callAPI:                () => ({ success: false, error: 'n/a' }),
    callAIProvider:         () => new ReturnObject({ status: 'error', message: 'n/a' }),
    getExtensionPreference: () => '',
    MathEvaluator:          undefined,
    crypto:                 undefined,
  });

  return cmds;
}

// ─── Discovery & Runner ───────────────────────────────────────────────────────

const helpers = { ok, section, p };

const dirs = fs.readdirSync(__dirname)
  .filter(d => {
    const full = path.join(__dirname, d);
    try {
      return fs.statSync(full).isDirectory()
          && fs.existsSync(path.join(full, 'index.test.js'))
          && fs.existsSync(path.join(full, 'extension.json'));
    } catch { return false; }
  })
  .sort();

for (const dir of dirs) {
  const testPath = path.join(__dirname, dir, 'index.test.js');
  const run = require(testPath);
  if (typeof run !== 'function') {
    process.stdout.write(`\n\x1b[33mskip\x1b[0m ${dir}/index.test.js (no default export)\n`);
    continue;
  }
  try {
    const cmds = loadExtension(dir);
    run(cmds, helpers);
  } catch (e) {
    process.stdout.write(`\n\x1b[31merror\x1b[0m ${dir}: ${e.message}\n`);
    failed++;
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

const total = passed + failed;
process.stdout.write(`\n${'─'.repeat(50)}\n`);
if (failed === 0) {
  process.stdout.write(`\x1b[32m${passed}/${total} tests passed\x1b[0m\n`);
} else {
  process.stdout.write(`\x1b[31m${failed} failed\x1b[0m, ${passed} passed (${total} total)\n`);
  process.exit(1);
}
