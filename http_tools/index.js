(function() {
  const extensionName = "http_tools";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: [],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Utilities",
    dataScope: "none"
  });

  const HTTP = {
    100: ['Continue',                        '1xx Informational'],
    101: ['Switching Protocols',             '1xx Informational'],
    102: ['Processing',                      '1xx Informational'],
    103: ['Early Hints',                     '1xx Informational'],
    200: ['OK',                              '2xx Success'],
    201: ['Created',                         '2xx Success'],
    202: ['Accepted',                        '2xx Success'],
    203: ['Non-Authoritative Information',   '2xx Success'],
    204: ['No Content',                      '2xx Success'],
    205: ['Reset Content',                   '2xx Success'],
    206: ['Partial Content',                 '2xx Success'],
    207: ['Multi-Status',                    '2xx Success'],
    208: ['Already Reported',               '2xx Success'],
    226: ['IM Used',                         '2xx Success'],
    300: ['Multiple Choices',               '3xx Redirection'],
    301: ['Moved Permanently',              '3xx Redirection'],
    302: ['Found',                           '3xx Redirection'],
    303: ['See Other',                       '3xx Redirection'],
    304: ['Not Modified',                    '3xx Redirection'],
    307: ['Temporary Redirect',             '3xx Redirection'],
    308: ['Permanent Redirect',             '3xx Redirection'],
    400: ['Bad Request',                     '4xx Client Error'],
    401: ['Unauthorized',                    '4xx Client Error'],
    402: ['Payment Required',               '4xx Client Error'],
    403: ['Forbidden',                       '4xx Client Error'],
    404: ['Not Found',                       '4xx Client Error'],
    405: ['Method Not Allowed',             '4xx Client Error'],
    406: ['Not Acceptable',                 '4xx Client Error'],
    407: ['Proxy Authentication Required',  '4xx Client Error'],
    408: ['Request Timeout',                '4xx Client Error'],
    409: ['Conflict',                        '4xx Client Error'],
    410: ['Gone',                            '4xx Client Error'],
    411: ['Length Required',                '4xx Client Error'],
    412: ['Precondition Failed',            '4xx Client Error'],
    413: ['Content Too Large',              '4xx Client Error'],
    414: ['URI Too Long',                    '4xx Client Error'],
    415: ['Unsupported Media Type',         '4xx Client Error'],
    416: ['Range Not Satisfiable',          '4xx Client Error'],
    417: ['Expectation Failed',             '4xx Client Error'],
    418: ["I'm a Teapot",                   '4xx Client Error'],
    421: ['Misdirected Request',            '4xx Client Error'],
    422: ['Unprocessable Content',          '4xx Client Error'],
    423: ['Locked',                          '4xx Client Error'],
    424: ['Failed Dependency',              '4xx Client Error'],
    425: ['Too Early',                       '4xx Client Error'],
    426: ['Upgrade Required',               '4xx Client Error'],
    428: ['Precondition Required',          '4xx Client Error'],
    429: ['Too Many Requests',              '4xx Client Error'],
    431: ['Request Header Fields Too Large','4xx Client Error'],
    451: ['Unavailable For Legal Reasons',  '4xx Client Error'],
    500: ['Internal Server Error',          '5xx Server Error'],
    501: ['Not Implemented',                '5xx Server Error'],
    502: ['Bad Gateway',                     '5xx Server Error'],
    503: ['Service Unavailable',            '5xx Server Error'],
    504: ['Gateway Timeout',                '5xx Server Error'],
    505: ['HTTP Version Not Supported',     '5xx Server Error'],
    506: ['Variant Also Negotiates',        '5xx Server Error'],
    507: ['Insufficient Storage',           '5xx Server Error'],
    508: ['Loop Detected',                  '5xx Server Error'],
    510: ['Not Extended',                   '5xx Server Error'],
    511: ['Network Authentication Required','5xx Server Error']
  };

  const MIME = {
    // Text
    html: 'text/html', htm: 'text/html',
    css: 'text/css',
    js: 'text/javascript', mjs: 'text/javascript',
    ts: 'text/typescript',
    txt: 'text/plain',
    csv: 'text/csv',
    xml: 'text/xml',
    md: 'text/markdown',
    yaml: 'text/yaml', yml: 'text/yaml',
    ics: 'text/calendar',
    vtt: 'text/vtt',
    // Application
    json: 'application/json',
    jsonld: 'application/ld+json',
    pdf: 'application/pdf',
    zip: 'application/zip',
    gz: 'application/gzip',
    tar: 'application/x-tar',
    '7z': 'application/x-7z-compressed',
    rar: 'application/vnd.rar',
    bz2: 'application/x-bzip2',
    xz: 'application/x-xz',
    wasm: 'application/wasm',
    bin: 'application/octet-stream',
    exe: 'application/octet-stream',
    dmg: 'application/octet-stream',
    deb: 'application/x-debian-package',
    rpm: 'application/x-rpm',
    sh: 'application/x-sh',
    sql: 'application/sql',
    xhtml: 'application/xhtml+xml',
    rtf: 'application/rtf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    odt: 'application/vnd.oasis.opendocument.text',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    odp: 'application/vnd.oasis.opendocument.presentation',
    epub: 'application/epub+zip',
    jar: 'application/java-archive',
    // Image
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    tiff: 'image/tiff', tif: 'image/tiff',
    avif: 'image/avif',
    heic: 'image/heic',
    heif: 'image/heif',
    // Audio
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    opus: 'audio/opus',
    weba: 'audio/webm',
    // Video
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    ogv: 'video/ogg',
    m4v: 'video/mp4',
    // Font
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject'
  };

  // --- http_status ---

  const http_status = new Command({
    name: "http_status",
    parameters: [
      new Parameter({type: "int", name: "code", helpText: "HTTP status code", default: "200"})
    ],
    type: "replaceLine",
    helpText: "Look up an HTTP status code and its category.",
    tutorials: [
      new TutorialCommand({command: "http_status(200)", description: "200 OK  [2xx Success]"}),
      new TutorialCommand({command: "http_status(404)", description: "404 Not Found  [4xx Client Error]"}),
      new TutorialCommand({command: "http_status(429)", description: "429 Too Many Requests  [4xx Client Error]"})
    ],
    extension: extensionRoot
  });
  http_status.execute = function(payload) {
    const [code] = this.getParsedParams(payload);
    const n = parseInt(code, 10);
    const entry = HTTP[n];
    if (!entry) return new ReturnObject({status: "error", message: "Unknown HTTP status code: " + n});
    return new ReturnObject({status: "success", message: "", payload: n + " " + entry[0] + "  [" + entry[1] + "]"});
  };

  // --- mime_type ---

  const mime_type = new Command({
    name: "mime_type",
    parameters: [
      new Parameter({type: "string", name: "ext", helpText: "File extension (without dot)", default: "json"})
    ],
    type: "replaceLine",
    helpText: "Look up the MIME type for a file extension.",
    tutorials: [
      new TutorialCommand({command: "mime_type(json)", description: "application/json"}),
      new TutorialCommand({command: "mime_type(png)", description: "image/png"}),
      new TutorialCommand({command: "mime_type(mp4)", description: "video/mp4"}),
      new TutorialCommand({command: "mime_type(woff2)", description: "font/woff2"})
    ],
    extension: extensionRoot
  });
  mime_type.execute = function(payload) {
    const [ext] = this.getParsedParams(payload);
    const key = ext.trim().toLowerCase().replace(/^\./, '');
    const mime = MIME[key];
    if (!mime) return new ReturnObject({status: "error", message: "Unknown extension: ." + key});
    return new ReturnObject({status: "success", message: "", payload: mime});
  };

})();
