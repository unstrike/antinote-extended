# antinote-extended

Custom [Antinote](https://antinote.io) extensions by [@unstrike](https://github.com/unstrike).

---

## Install

1. Copy the extension folder(s) you want into Antinote's Extensions directory:
   ```
   ~/Library/Containers/com.chabomakers.Antinote/Data/Library/Application Support/Antinote/Extensions/
   ```
2. Reload extensions in **Antinote → Preferences → Extensions → Reload**.

---

## Extensions

### cert_tools

X.509 certificate inspection. Paste a full PEM block into a note, then run the command. No network required.

| Command | Type | Description |
|---------|------|-------------|
| `::cert_decode()` | insert | Decode a PEM certificate: subject, issuer, validity dates, SANs, key type |
| `::cert_days()` | replaceLine | Days until the certificate expires |

---

### crypto_tools

Random value generators. All local — no network.

| Command | Type | Description |
|---------|------|-------------|
| `::uuid_gen()` | insert | Generate a UUID v4 |
| `::rand_hex(n)` | insert | n random bytes as a hex string (default 16) |
| `::rand_b64(n)` | insert | n random bytes as a base64 string (default 16) |
| `::password_gen(len, charset)` | insert | Random password. Charset presets: `alpha`, `alphanumeric`, `numeric`, `hex`, `full` (default) |

**Examples:**
```
::uuid_gen()               →  f47ac10b-58cc-4372-a567-0e02b2c3d479
::rand_hex(8)              →  a3f1c92b4e7d0581
::rand_b64(16)             →  k9X2mP+rLqY8nTvw==
::password_gen(20, alpha)  →  XkQpRmJvNzLtYwBfCaHs
```

---

### encode

Base64, URL percent-encoding, and HTML entity encoding/decoding. All local.

| Command | Type | Description |
|---------|------|-------------|
| `::b64_encode(text)` | replaceLine | Base64-encode text (UTF-8 aware) |
| `::b64_decode(text)` | replaceLine | Decode a Base64 string |
| `::url_encode(text)` | replaceLine | Percent-encode text for use in URLs |
| `::url_decode(text)` | replaceLine | Decode a percent-encoded string |
| `::html_encode(text)` | replaceLine | Escape HTML special characters |
| `::html_decode(text)` | replaceLine | Decode HTML entities back to plain text |

**Examples:**
```
::b64_encode("Hello World")         →  SGVsbG8gV29ybGQ=
::b64_decode("SGVsbG8gV29ybGQ=")    →  Hello World
::url_encode("a=1&b=2")             →  a%3D1%26b%3D2
::html_encode("<b>AT&T</b>")        →  &lt;b&gt;AT&amp;T&lt;/b&gt;
```

---

### hash

Non-cryptographic (32-bit) and cryptographic hash functions. All computed locally.

| Command | Type | Description |
|---------|------|-------------|
| `::hash_crc32(text)` | replaceLine | CRC32 (8-char hex) |
| `::hash_fnv1a(text)` | replaceLine | FNV-1a 32-bit (8-char hex) |
| `::hash_djb2(text)` | replaceLine | djb2 (8-char hex) |
| `::hash_adler32(text)` | replaceLine | Adler-32 (8-char hex) |
| `::hash_md5(text)` | replaceLine | MD5 (32-char hex) |
| `::hash_sha1(text)` | replaceLine | SHA-1 (40-char hex) |
| `::hash_sha256(text)` | replaceLine | SHA-256 (64-char hex) |
| `::hash_sha512(text)` | replaceLine | SHA-512 (128-char hex) |
| `::hash_all(text)` | insert | All eight algorithms at once |

**Examples:**
```
::hash_md5("hello")     →  5d41402abc4b2a76b9719d911017c592
::hash_sha256("hello")  →  2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
::hash_all("hello")
→ CRC32:   3610A686
  FNV-1a:  4F9F2CAB
  djb2:    A30C31D5
  Adler32: 062C0215
  MD5:     5d41402abc4b2a76b9719d911017c592
  SHA-1:   aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d
  SHA-256: 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
  SHA-512: 9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7…
```

---

### http_tools

HTTP reference lookups. All local — no network.

| Command | Type | Description |
|---------|------|-------------|
| `::http_status(code)` | insert | Status code name and category (1xx–5xx) |
| `::mime_type(ext)` | insert | MIME type for a file extension |

**Examples:**
```
::http_status(404)   →  404 Not Found  [4xx Client Error]
::http_status(301)   →  301 Moved Permanently  [3xx Redirection]
::mime_type(json)    →  application/json
::mime_type(woff2)   →  font/woff2
```

---

### ip_tools

IPv4 address and subnet utilities. All local — no network.

| Command | Type | Description |
|---------|------|-------------|
| `::cidr_info(cidr)` | insert | Full CIDR breakdown: network, broadcast, mask, wildcard, host range, count |
| `::ip_info(ip)` | insert | IP classification: type, class, binary, decimal |
| `::ip_in_cidr(ip, cidr)` | replaceLine | Check if an IP falls within a CIDR range |
| `::subnet_mask(prefix)` | replaceLine | Convert prefix length to subnet mask and wildcard |
| `::ip_to_binary(ip)` | replaceLine | Convert an IPv4 address to dotted binary notation |

**Examples:**
```
::cidr_info(192.168.1.0/24)
→ Network:     192.168.1.0/24
  Subnet mask: 255.255.255.0
  Wildcard:    0.0.0.255
  Broadcast:   192.168.1.255
  First host:  192.168.1.1
  Last host:   192.168.1.254
  Hosts:       254 usable / 256 total

::ip_in_cidr(10.0.5.1, 10.0.0.0/16)  →  10.0.5.1 is IN 10.0.0.0/16
```

---

### json

JSON formatting, validation, and path extraction. Operates on the full note (`dataScope: full`).

| Command | Type | Description |
|---------|------|-------------|
| `::json_fmt()` | replaceAll | Pretty-print the JSON in the note (2-space indent) |
| `::json_min()` | replaceAll | Minify the JSON in the note |
| `::json_validate()` | insert | Validate JSON and report type/key count, or parse error |
| `::json_get(path)` | insert | Extract a value by dot/bracket path |

**Path syntax:** `.` (root), `.key`, `.key.sub`, `.arr[0]`, `.arr[0].field`

**Examples:**
```
# Note contains: {"name":"Alice","scores":[95,87,92]}
::json_validate()         →  Valid JSON (object, 2 keys)
::json_get(".name")       →  Alice
::json_get(".scores[0]")  →  95
```

---

### jwt

JWT inspection without signature verification.

| Command | Type | Description |
|---------|------|-------------|
| `::jwt_decode(token)` | insert | Decode header, payload, expiry, and issued-at |
| `::jwt_exp(token)` | replaceLine | Show expiry and whether the token is still valid |

**Examples:**
```
::jwt_decode("eyJ...")
→ ── Header ──
  {"alg": "HS256", "typ": "JWT"}
  ── Payload ──
  {"sub": "1234567890"}

::jwt_exp("eyJ...")  →  2026-01-01T00:00:00.000Z  (valid for 42d 3h)
```

---

### mac_tools

MAC address lookup and classification. OUI database is embedded — no network.

| Command | Type | Description |
|---------|------|-------------|
| `::mac_info(mac)` | insert | Vendor info via OUI lookup (accepts any common separator format) |
| `::mac_type(mac)` | insert | Address type: unicast/multicast, globally/locally administered, broadcast |

**Examples:**
```
::mac_info(00:50:56:01:02:03)  →  VMware, Inc.  (unicast, globally administered)
::mac_type(FF:FF:FF:FF:FF:FF)  →  broadcast
::mac_type(01:00:5E:00:00:01)  →  multicast (IPv4)
```

---

### number_base

Integer base conversion and byte size. All local.

| Command | Type | Description |
|---------|------|-------------|
| `::to_hex(n)` | replaceLine | Decimal → hexadecimal |
| `::to_bin(n)` | replaceLine | Decimal → binary |
| `::to_oct(n)` | replaceLine | Decimal → octal |
| `::to_dec(n, base)` | replaceLine | Any base (2–36) → decimal |
| `::byte_size(text)` | replaceLine | UTF-8 byte count and character count |

**Examples:**
```
::to_hex(255)          →  0xFF
::to_bin(10)           →  0b1010
::to_dec(FF, 16)       →  255
::byte_size(café)      →  5 bytes, 4 chars
```

---

### obsidian

Create and manage tasks in [Obsidian TaskNotes](https://github.com/GreenMashimaro/obsidian-task-notes) from Antinote.

**Requires:** TaskNotes plugin with HTTP API enabled (`Obsidian → TaskNotes → Integrations → HTTP API`, default port 27124). Leave auth token blank for local use.

| Command | Type | Description |
|---------|------|-------------|
| `::obs_task(title, priority, due)` | insert | Create a task (priority: `low`/`normal`/`high`/`urgent`, due: `YYYY-MM-DD`) |
| `::obs_nlp(text)` | insert | Create a task from natural language — date, priority, context parsed automatically |
| `::obs_tasks(status)` | insert | List tasks filtered by status: `open`, `in-progress`, `done`, `all` |
| `::obs_done()` | replaceLine | Mark the task on the current line as done |
| `::obs_stats()` | insert | Task statistics |

**Examples:**
```
::obs_task("Review PR", high, 2026-03-28)
::obs_nlp("follow up with client tomorrow morning urgent")
::obs_tasks(open)
::obs_done()   ← run on a line containing a task
```

---

### pentest

Utilities for pentest notes. All local — no network.

| Command | Type | Description |
|---------|------|-------------|
| `::ports_fmt()` | replaceAll | Parse nmap output and reformat as a clean table grouped by host |
| `::hash_id(hash)` | insert | Identify likely hash algorithm(s) for a given hash string |
| `::url_parse(url)` | insert | Break a URL into scheme, host, port, path, query params, and fragment |
| `::payload_gen(type)` | insert | Common test payloads for: `xss`, `sqli`, `lfi`, `ssti`, `xxe`, `open_redirect`, `cmd`, `ssrf`, `nosqli`, `header` |

**Examples:**
```
::hash_id(5d41402abc4b2a76b9719d911017c592)  →  MD5 (32 hex chars)
::url_parse(https://example.com:8080/path?q=1#frag)
→ Scheme: https
  Host:   example.com
  Port:   8080
  Path:   /path
  Query:  q=1
  Fragment: frag
::payload_gen(xss)  →  <script>alert(1)</script>  …
```

---

### qr

Generate QR codes via [api.qrserver.com](https://api.qrserver.com) (free, no API key).

| Command | Type | Description |
|---------|------|-------------|
| `::qr(text)` | openURL | Open QR code image in browser |
| `::qr(text, size)` | openURL | Open QR code at a specific pixel size (50–1000, default 300) |
| `::qr_url(text)` | insert | Insert the QR image URL into the note |

**Examples:**
```
::qr("https://example.com")      →  opens QR image in browser
::qr("Hello World", 500)         →  opens 500px QR image
::qr_url("https://example.com")  →  https://api.qrserver.com/v1/create-qr-code/?data=…
```

---

### recon

ASN and IP lookup via [ipapi.co](https://ipapi.co) and [RIPE STAT](https://stat.ripe.net).

**Requires:** An API key entry named `apikey_bgpview` in Antinote Preferences (value can be left blank — it is not sent to the API endpoints, but Antinote requires the key to be registered).

| Command | Type | Description |
|---------|------|-------------|
| `::asn_lookup(target)` | insert | ASN, org, country, and prefix info for an IP or ASN number (`1.1.1.1`, `AS13335`, or `13335`) |

**Examples:**
```
::asn_lookup(1.1.1.1)
→ IP:      1.1.1.1
  ASN:     AS13335
  Org:     CLOUDFLARENET
  Country: US
  Prefix:  1.1.1.0/24

::asn_lookup(AS13335)
→ ASN:     AS13335
  Name:    CLOUDFLARENET
  …
```

---

### time

Unix timestamp utilities. All local — no network.

| Command | Type | Description |
|---------|------|-------------|
| `::epoch(date)` | replaceLine | Convert a date/datetime string to a Unix timestamp. Bare `YYYY-MM-DD` treated as UTC midnight. |
| `::from_epoch(ts)` | replaceLine | Convert a Unix timestamp to a UTC datetime string |
| `::now()` | insert | Insert the current Unix timestamp |
| `::date_diff(date1, date2)` | replaceLine | Difference between two dates as `Xd Xh Xm Xs` |
| `::tz_convert(ts, timezone)` | replaceLine | Format a timestamp in an IANA timezone |

**Examples:**
```
::epoch("2024-01-15")                        →  1705276800
::from_epoch(1705276800)                     →  2024-01-15 00:00:00 UTC
::now()                                      →  1742104800
::date_diff("2020-01-01", "now")             →  2245d 7h 22m 14s
::tz_convert(1705276800, "Asia/Tokyo")       →  2024-01-15 09:00:00 Asia/Tokyo
```
