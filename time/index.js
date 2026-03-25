(function() {
  const extensionName = "time";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Utilities",
    dataScope: "none"
  });

  // Parse a date string, number, or "now" to milliseconds
  function parseToMs(input) {
    const s = String(input).trim();
    if (s === 'now') return Date.now();
    const n = Number(s);
    if (!isNaN(n) && s !== '') return n < 1e11 ? n * 1000 : n; // seconds if < year 5138
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T00:00:00Z').getTime();
    return new Date(s).getTime();
  }

  function fmtUtc(ms) {
    const d = new Date(ms);
    return d.getUTCFullYear() + '-' +
      String(d.getUTCMonth()+1).padStart(2,'0') + '-' +
      String(d.getUTCDate()).padStart(2,'0') + ' ' +
      String(d.getUTCHours()).padStart(2,'0') + ':' +
      String(d.getUTCMinutes()).padStart(2,'0') + ':' +
      String(d.getUTCSeconds()).padStart(2,'0') + ' UTC';
  }

  // === epoch ===
  const epoch = new Command({
    name: "epoch",
    parameters: [
      new Parameter({type:"string",name:"date",helpText:"Date/datetime string or 'now'. Bare YYYY-MM-DD treated as UTC midnight.",default:"now"})
    ],
    type: "replaceLine",
    helpText: "Convert a date/datetime string to a Unix timestamp in seconds.",
    tutorials: [
      new TutorialCommand({command:'epoch("2024-01-15")',description:"Unix timestamp for 2024-01-15 00:00:00 UTC"}),
      new TutorialCommand({command:'epoch("2024-01-15T12:00:00Z")',description:"Unix timestamp for an explicit UTC datetime"}),
      new TutorialCommand({command:'epoch("now")',description:"Current Unix timestamp"})
    ],
    extension: extensionRoot
  });
  epoch.execute = function(payload) {
    const [date] = this.getParsedParams(payload);
    if (!date) return new ReturnObject({status:"error",message:"Provide a date string or 'now'."});
    try {
      const ms = parseToMs(date);
      if (isNaN(ms)) return new ReturnObject({status:"error",message:"Could not parse: " + date});
      return new ReturnObject({status:"success",message:"Epoch calculated.",payload:String(Math.floor(ms/1000))});
    } catch(e) {
      return new ReturnObject({status:"error",message:"Error: " + e.message});
    }
  };

  // === from_epoch ===
  const from_epoch = new Command({
    name: "from_epoch",
    parameters: [
      new Parameter({type:"string",name:"timestamp",helpText:"Unix timestamp in seconds (or ms if > 10^10)",default:"0"})
    ],
    type: "replaceLine",
    helpText: "Convert a Unix timestamp to a human-readable UTC datetime string.",
    tutorials: [
      new TutorialCommand({command:'from_epoch(1705276800)',description:"→ 2024-01-15 00:00:00 UTC"}),
      new TutorialCommand({command:'from_epoch(0)',description:"→ 1970-01-01 00:00:00 UTC"})
    ],
    extension: extensionRoot
  });
  from_epoch.execute = function(payload) {
    const [ts] = this.getParsedParams(payload);
    if (ts === undefined || ts === null) return new ReturnObject({status:"error",message:"Provide a timestamp."});
    try {
      const ms = parseToMs(ts);
      if (isNaN(ms)) return new ReturnObject({status:"error",message:"Invalid timestamp: " + ts});
      return new ReturnObject({status:"success",message:"Date formatted.",payload:fmtUtc(ms)});
    } catch(e) {
      return new ReturnObject({status:"error",message:"Error: " + e.message});
    }
  };

  // === now ===
  const now = new Command({
    name: "now",
    parameters: [],
    type: "insert",
    helpText: "Insert the current Unix timestamp in seconds.",
    tutorials: [
      new TutorialCommand({command:'now()',description:"Current Unix timestamp"})
    ],
    extension: extensionRoot
  });
  now.execute = function(payload) {
    return new ReturnObject({status:"success",message:"Current timestamp.",payload:String(Math.floor(Date.now()/1000))});
  };

  // === date_diff ===
  const date_diff = new Command({
    name: "date_diff",
    parameters: [
      new Parameter({type:"string",name:"date1",helpText:"First date",default:"2024-01-01"}),
      new Parameter({type:"string",name:"date2",helpText:"Second date (or 'now')",default:"now"})
    ],
    type: "replaceLine",
    helpText: "Difference between two dates. Returns days, hours, minutes, seconds.",
    tutorials: [
      new TutorialCommand({command:'date_diff("2024-01-01", "2024-12-31")',description:"Days between two dates"}),
      new TutorialCommand({command:'date_diff("2020-03-15", "now")',description:"Time elapsed since a past date"})
    ],
    extension: extensionRoot
  });
  date_diff.execute = function(payload) {
    const [d1, d2] = this.getParsedParams(payload);
    if (!d1 || !d2) return new ReturnObject({status:"error",message:"Provide two dates."});
    try {
      const ms1 = parseToMs(d1), ms2 = parseToMs(d2);
      if (isNaN(ms1) || isNaN(ms2)) return new ReturnObject({status:"error",message:"Could not parse one or both dates."});
      const diff = Math.abs(ms2 - ms1);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      let result = '';
      if (days > 0) result += days + 'd ';
      if (hours > 0 || days > 0) result += hours + 'h ';
      if (mins > 0 || hours > 0 || days > 0) result += mins + 'm ';
      result += secs + 's';
      return new ReturnObject({status:"success",message:"Difference calculated.",payload:result.trim()});
    } catch(e) {
      return new ReturnObject({status:"error",message:"Error: " + e.message});
    }
  };

  // === tz_convert ===
  const tz_convert = new Command({
    name: "tz_convert",
    parameters: [
      new Parameter({type:"string",name:"timestamp",helpText:"Unix timestamp in seconds",default:"0"}),
      new Parameter({type:"string",name:"timezone",helpText:"IANA timezone name",default:"UTC"})
    ],
    type: "replaceLine",
    helpText: "Format a Unix timestamp in the given IANA timezone (e.g. America/New_York, Europe/London, Asia/Tokyo).",
    tutorials: [
      new TutorialCommand({command:'tz_convert(1705276800, "America/New_York")',description:"2024-01-14 in New York"}),
      new TutorialCommand({command:'tz_convert(1705276800, "Asia/Tokyo")',description:"2024-01-15 in Tokyo"})
    ],
    extension: extensionRoot
  });
  tz_convert.execute = function(payload) {
    const [ts, tz] = this.getParsedParams(payload);
    if (!ts || !tz) return new ReturnObject({status:"error",message:"Provide timestamp and timezone."});
    try {
      const ms = parseToMs(ts);
      if (isNaN(ms)) return new ReturnObject({status:"error",message:"Invalid timestamp: " + ts});
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', second:'2-digit',
        hour12: false
      }).formatToParts(new Date(ms));
      const get = type => (parts.find(p => p.type === type) || {value:''}).value;
      const result = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} ${tz}`;
      return new ReturnObject({status:"success",message:"Time converted.",payload:result});
    } catch(e) {
      return new ReturnObject({status:"error",message:"Error: " + e.message + ". Check timezone name (IANA format)."});
    }
  };

})();
