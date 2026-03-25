(function() {
  const extensionName = "recon";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.1.0",
    endpoints: ["https://ipapi.co", "https://stat.ripe.net"],
    requiredAPIKeys: ["apikey_bgpview"],
    author: "unstrike",
    category: "Security",
    dataScope: "none",
    dependencies: [],
    isService: false
  });

  // ─── asn_lookup ─────────────────────────────────────────────────────────────

  const asn_lookup = new Command({
    name: "asn_lookup",
    parameters: [
      new Parameter({type: "string", name: "target", helpText: "IPv4 address or ASN number (e.g. 1.1.1.1 or AS13335 or 13335)", default: "1.1.1.1"})
    ],
    type: "insert",
    helpText: "Look up ASN, org, and country for an IP (ipapi.co) or ASN number (RIPE STAT). No API key required.",
    tutorials: [
      new TutorialCommand({command: "asn_lookup(1.1.1.1)", description: "ASN and org info for an IP address"}),
      new TutorialCommand({command: "asn_lookup(AS13335)", description: "Org info for Cloudflare's ASN"}),
      new TutorialCommand({command: "asn_lookup(21928)", description: "Org info for T-Mobile's ASN"})
    ],
    extension: extensionRoot
  });

  asn_lookup.execute = function(payload) {
    const [target] = this.getParsedParams(payload);
    if (!target) return new ReturnObject({status: "error", message: "Provide an IP or ASN (e.g. 1.1.1.1 or AS13335)."});

    const t        = target.trim();
    const asnMatch = t.match(/^(?:AS)?(\d+)$/i);
    const isIP     = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(t);

    if (!isIP && !asnMatch) {
      return new ReturnObject({status: "error", message: "Input must be an IPv4 address or ASN number."});
    }

    const headers = JSON.stringify({"Accept": "application/json"});

    if (isIP) {
      const res = callAPI("apikey_bgpview", "https://ipapi.co/" + t + "/json/", "GET", headers, "");
      if (!res.success) return new ReturnObject({status: "error", message: "Lookup failed: " + res.error});

      const d = JSON.parse(res.data);
      if (d.error) return new ReturnObject({status: "error", message: "API error: " + (d.reason || d.error)});

      const lines = ["IP:       " + d.ip];
      if (d.hostname && d.hostname !== d.ip) lines.push("PTR:      " + d.hostname);
      if (d.asn)          lines.push("ASN:      " + d.asn);
      if (d.org)          lines.push("Org:      " + d.org);
      if (d.country_name) lines.push("Country:  " + d.country_name + " (" + d.country_code + ")");
      if (d.city)         lines.push("City:     " + d.city + (d.region ? ", " + d.region : ""));

      return new ReturnObject({status: "success", message: "Lookup complete.", payload: lines.join('\n')});

    } else {
      const asn = asnMatch[1];
      const res  = callAPI("apikey_bgpview", "https://stat.ripe.net/data/as-overview/data.json?resource=AS" + asn, "GET", headers, "");
      if (!res.success) return new ReturnObject({status: "error", message: "Lookup failed: " + res.error});

      const json = JSON.parse(res.data);
      if (json.status !== "ok") return new ReturnObject({status: "error", message: "API error."});

      const d     = json.data;
      const lines = ["ASN:      AS" + asn];
      if (d.holder)              lines.push("Name:     " + d.holder);
      if (d.block && d.block.desc && d.block.desc !== d.holder)
                                 lines.push("Org:      " + d.block.desc);
      if (d.announced !== undefined) lines.push("Announced: " + (d.announced ? "yes" : "no"));

      return new ReturnObject({status: "success", message: "Lookup complete.", payload: lines.join('\n')});
    }
  };

})();
