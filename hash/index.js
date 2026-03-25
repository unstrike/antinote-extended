(function() {
  const extensionName = "hash";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "2.0.0",
    endpoints: [],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Utilities",
    dataScope: "none"
  });

  // === Shared UTF-8 encoder ===
  function strToUtf8Bytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF)
        c = 0x10000 + ((c - 0xD800) << 10) + (str.charCodeAt(++i) - 0xDC00);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) bytes.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
      else if (c < 0x10000) bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
      else bytes.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 0x3F), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
    }
    return bytes;
  }

  // === Non-crypto hashes ===
  function crc32(str) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i);
      for (let j = 0; j < 8; j++) crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
  }

  function fnv1a32(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h.toString(16).toUpperCase().padStart(8, '0');
  }

  function djb2(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(16).toUpperCase().padStart(8, '0');
  }

  function adler32(str) {
    const MOD = 65521; let a = 1, b = 0;
    for (let i = 0; i < str.length; i++) { a = (a + str.charCodeAt(i)) % MOD; b = (b + a) % MOD; }
    return (((b << 16) | a) >>> 0).toString(16).toUpperCase().padStart(8, '0');
  }

  // === Crypto hashes ===
  function md5(str) {
    function safeAdd(x, y) { const l=(x&0xFFFF)+(y&0xFFFF); return ((x>>16)+(y>>16)+(l>>16))<<16|(l&0xFFFF); }
    function rotl(n, b) { return n << b | n >>> (32 - b); }
    function cmn(q,a,b,x,s,t) { return safeAdd(rotl(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b); }
    function ff(a,b,c,d,x,s,t){return cmn((b&c)|(~b&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&~d),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return cmn(c^(b|~d),a,b,x,s,t);}
    const bytes = strToUtf8Bytes(str), msgLen = bytes.length;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const bl = msgLen * 8;
    bytes.push(bl&0xFF,(bl>>8)&0xFF,(bl>>16)&0xFF,(bl>>24)&0xFF,0,0,0,0);
    const M = [];
    for (let i = 0; i < bytes.length; i += 4)
      M.push(bytes[i]|(bytes[i+1]<<8)|(bytes[i+2]<<16)|(bytes[i+3]<<24));
    let a=0x67452301,b=0xEFCDAB89,c=0x98BADCFE,d=0x10325476;
    for (let i = 0; i < M.length; i += 16) {
      const m=M.slice(i,i+16),aa=a,bb=b,cc=c,dd=d;
      a=ff(a,b,c,d,m[0],7,-680876936);d=ff(d,a,b,c,m[1],12,-389564586);c=ff(c,d,a,b,m[2],17,606105819);b=ff(b,c,d,a,m[3],22,-1044525330);
      a=ff(a,b,c,d,m[4],7,-176418897);d=ff(d,a,b,c,m[5],12,1200080426);c=ff(c,d,a,b,m[6],17,-1473231341);b=ff(b,c,d,a,m[7],22,-45705983);
      a=ff(a,b,c,d,m[8],7,1770035416);d=ff(d,a,b,c,m[9],12,-1958414417);c=ff(c,d,a,b,m[10],17,-42063);b=ff(b,c,d,a,m[11],22,-1990404162);
      a=ff(a,b,c,d,m[12],7,1804603682);d=ff(d,a,b,c,m[13],12,-40341101);c=ff(c,d,a,b,m[14],17,-1502002290);b=ff(b,c,d,a,m[15],22,1236535329);
      a=gg(a,b,c,d,m[1],5,-165796510);d=gg(d,a,b,c,m[6],9,-1069501632);c=gg(c,d,a,b,m[11],14,643717713);b=gg(b,c,d,a,m[0],20,-373897302);
      a=gg(a,b,c,d,m[5],5,-701558691);d=gg(d,a,b,c,m[10],9,38016083);c=gg(c,d,a,b,m[15],14,-660478335);b=gg(b,c,d,a,m[4],20,-405537848);
      a=gg(a,b,c,d,m[9],5,568446438);d=gg(d,a,b,c,m[14],9,-1019803690);c=gg(c,d,a,b,m[3],14,-187363961);b=gg(b,c,d,a,m[8],20,1163531501);
      a=gg(a,b,c,d,m[13],5,-1444681467);d=gg(d,a,b,c,m[2],9,-51403784);c=gg(c,d,a,b,m[7],14,1735328473);b=gg(b,c,d,a,m[12],20,-1926607734);
      a=hh(a,b,c,d,m[5],4,-378558);d=hh(d,a,b,c,m[8],11,-2022574463);c=hh(c,d,a,b,m[11],16,1839030562);b=hh(b,c,d,a,m[14],23,-35309556);
      a=hh(a,b,c,d,m[1],4,-1530992060);d=hh(d,a,b,c,m[4],11,1272893353);c=hh(c,d,a,b,m[7],16,-155497632);b=hh(b,c,d,a,m[10],23,-1094730640);
      a=hh(a,b,c,d,m[13],4,681279174);d=hh(d,a,b,c,m[0],11,-358537222);c=hh(c,d,a,b,m[3],16,-722521979);b=hh(b,c,d,a,m[6],23,76029189);
      a=hh(a,b,c,d,m[9],4,-640364487);d=hh(d,a,b,c,m[12],11,-421815835);c=hh(c,d,a,b,m[15],16,530742520);b=hh(b,c,d,a,m[2],23,-995338651);
      a=ii(a,b,c,d,m[0],6,-198630844);d=ii(d,a,b,c,m[7],10,1126891415);c=ii(c,d,a,b,m[14],15,-1416354905);b=ii(b,c,d,a,m[5],21,-57434055);
      a=ii(a,b,c,d,m[12],6,1700485571);d=ii(d,a,b,c,m[3],10,-1894986606);c=ii(c,d,a,b,m[10],15,-1051523);b=ii(b,c,d,a,m[1],21,-2054922799);
      a=ii(a,b,c,d,m[8],6,1873313359);d=ii(d,a,b,c,m[15],10,-30611744);c=ii(c,d,a,b,m[6],15,-1560198380);b=ii(b,c,d,a,m[13],21,1309151649);
      a=ii(a,b,c,d,m[4],6,-145523070);d=ii(d,a,b,c,m[11],10,-1120210379);c=ii(c,d,a,b,m[2],15,718787259);b=ii(b,c,d,a,m[9],21,-343485551);
      a=safeAdd(a,aa);b=safeAdd(b,bb);c=safeAdd(c,cc);d=safeAdd(d,dd);
    }
    function leHex(n){return[(n&0xFF),((n>>8)&0xFF),((n>>16)&0xFF),((n>>24)&0xFF)].map(v=>v.toString(16).padStart(2,'0')).join('');}
    return leHex(a)+leHex(b)+leHex(c)+leHex(d);
  }

  function sha1(str) {
    const bytes = strToUtf8Bytes(str), bl = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push((bl / Math.pow(2, i * 8)) & 0xFF);
    function rotl(n,s){return((n<<s)|(n>>>(32-s)))>>>0;}
    let h0=0x67452301,h1=0xEFCDAB89,h2=0x98BADCFE,h3=0x10325476,h4=0xC3D2E1F0;
    for (let i = 0; i < bytes.length; i += 64) {
      const W=[];
      for (let j=0;j<16;j++) W[j]=(bytes[i+j*4]<<24)|(bytes[i+j*4+1]<<16)|(bytes[i+j*4+2]<<8)|bytes[i+j*4+3];
      for (let j=16;j<80;j++) W[j]=rotl(W[j-3]^W[j-8]^W[j-14]^W[j-16],1);
      let a=h0,b=h1,c=h2,d=h3,e=h4;
      for (let j=0;j<80;j++) {
        let f,k;
        if(j<20){f=(b&c)|(~b&d);k=0x5A827999;}
        else if(j<40){f=b^c^d;k=0x6ED9EBA1;}
        else if(j<60){f=(b&c)|(b&d)|(c&d);k=0x8F1BBCDC;}
        else{f=b^c^d;k=0xCA62C1D6;}
        const t=(rotl(a,5)+f+e+k+W[j])>>>0;
        e=d;d=c;c=rotl(b,30);b=a;a=t;
      }
      h0=(h0+a)>>>0;h1=(h1+b)>>>0;h2=(h2+c)>>>0;h3=(h3+d)>>>0;h4=(h4+e)>>>0;
    }
    return [h0,h1,h2,h3,h4].map(h=>h.toString(16).padStart(8,'0')).join('');
  }

  function sha256(str) {
    const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const bytes=strToUtf8Bytes(str), bl=bytes.length*8;
    bytes.push(0x80);
    while(bytes.length%64!==56)bytes.push(0);
    for(let i=7;i>=0;i--)bytes.push((bl/Math.pow(2,i*8))&0xFF);
    let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    function rotr(x,n){return(x>>>n)|(x<<(32-n));}
    for(let i=0;i<bytes.length;i+=64){
      const W=[];
      for(let j=0;j<16;j++)W[j]=(bytes[i+j*4]<<24)|(bytes[i+j*4+1]<<16)|(bytes[i+j*4+2]<<8)|bytes[i+j*4+3];
      for(let j=16;j<64;j++){
        const s0=rotr(W[j-15],7)^rotr(W[j-15],18)^(W[j-15]>>>3);
        const s1=rotr(W[j-2],17)^rotr(W[j-2],19)^(W[j-2]>>>10);
        W[j]=(W[j-16]+s0+W[j-7]+s1)>>>0;
      }
      let[a,b,c,d,e,f,g,h]=H;
      for(let j=0;j<64;j++){
        const S1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^(~e&g);
        const t1=(h+S1+ch+K[j]+W[j])>>>0;
        const S0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c);
        const t2=(S0+maj)>>>0;
        h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
      }
      H=H.map((v,idx)=>(v+[a,b,c,d,e,f,g,h][idx])>>>0);
    }
    return H.map(h=>h.toString(16).padStart(8,'0')).join('');
  }

  function sha512(str) {
    const MASK=(1n<<64n)-1n;
    function r64(x,n){return((x>>BigInt(n))|(x<<BigInt(64-n)))&MASK;}
    function add64(...a){return a.reduce((s,v)=>(s+v)&MASK,0n);}
    const K=[
      0x428a2f98d728ae22n,0x7137449123ef65cdn,0xb5c0fbcfec4d3b2fn,0xe9b5dba58189dbbcn,
      0x3956c25bf348b538n,0x59f111f1b605d019n,0x923f82a4af194f9bn,0xab1c5ed5da6d8118n,
      0xd807aa98a3030242n,0x12835b0145706fben,0x243185be4ee4b28cn,0x550c7dc3d5ffb4e2n,
      0x72be5d74f27b896fn,0x80deb1fe3b1696b1n,0x9bdc06a725c71235n,0xc19bf174cf692694n,
      0xe49b69c19ef14ad2n,0xefbe4786384f25e3n,0x0fc19dc68b8cd5b5n,0x240ca1cc77ac9c65n,
      0x2de92c6f592b0275n,0x4a7484aa6ea6e483n,0x5cb0a9dcbd41fbd4n,0x76f988da831153b5n,
      0x983e5152ee66dfabn,0xa831c66d2db43210n,0xb00327c898fb213fn,0xbf597fc7beef0ee4n,
      0xc6e00bf33da88fc2n,0xd5a79147930aa725n,0x06ca6351e003826fn,0x142929670a0e6e70n,
      0x27b70a8546d22ffcn,0x2e1b21385c26c926n,0x4d2c6dfc5ac42aedn,0x53380d139d95b3dfn,
      0x650a73548baf63den,0x766a0abb3c77b2a8n,0x81c2c92e47edaee6n,0x92722c851482353bn,
      0xa2bfe8a14cf10364n,0xa81a664bbc423001n,0xc24b8b70d0f89791n,0xc76c51a30654be30n,
      0xd192e819d6ef5218n,0xd69906245565a910n,0xf40e35855771202an,0x106aa07032bbd1b8n,
      0x19a4c116b8d2d0c8n,0x1e376c085141ab53n,0x2748774cdf8eeb99n,0x34b0bcb5e19b48a8n,
      0x391c0cb3c5c95a63n,0x4ed8aa4ae3418acbn,0x5b9cca4f7763e373n,0x682e6ff3d6b2b8a3n,
      0x748f82ee5defb2fcn,0x78a5636f43172f60n,0x84c87814a1f0ab72n,0x8cc702081a6439ecn,
      0x90befffa23631e28n,0xa4506cebde82bde9n,0xbef9a3f7b2c67915n,0xc67178f2e372532bn,
      0xca273eceea26619cn,0xd186b8c721c0c207n,0xeada7dd6cde0eb1en,0xf57d4f7fee6ed178n,
      0x06f067aa72176fban,0x0a637dc5a2c898a6n,0x113f9804bef90daen,0x1b710b35131c471bn,
      0x28db77f523047d84n,0x32caab7b40c72493n,0x3c9ebe0a15c9bebcn,0x431d67c49c100d4cn,
      0x4cc5d4becb3e42b6n,0x597f299cfc657e2an,0x5fcb6fab3ad6faecn,0x6c44198c4a475817n
    ];
    const bytes=strToUtf8Bytes(str), bl=bytes.length*8;
    bytes.push(0x80);
    while(bytes.length%128!==112)bytes.push(0);
    for(let i=15;i>=0;i--)bytes.push((bl/Math.pow(2,i*8))&0xFF);
    let H=[
      0x6a09e667f3bcc908n,0xbb67ae8584caa73bn,0x3c6ef372fe94f82bn,0xa54ff53a5f1d36f1n,
      0x510e527fade682d1n,0x9b05688c2b3e6c1fn,0x1f83d9abfb41bd6bn,0x5be0cd19137e2179n
    ];
    for(let i=0;i<bytes.length;i+=128){
      const W=[];
      for(let j=0;j<16;j++){let v=0n;for(let k=0;k<8;k++)v=(v<<8n)|BigInt(bytes[i+j*8+k]);W[j]=v;}
      for(let j=16;j<80;j++){
        const s0=r64(W[j-15],1)^r64(W[j-15],8)^(W[j-15]>>7n);
        const s1=r64(W[j-2],19)^r64(W[j-2],61)^(W[j-2]>>6n);
        W[j]=add64(W[j-16],s0,W[j-7],s1);
      }
      let[a,b,c,d,e,f,g,h]=H;
      for(let j=0;j<80;j++){
        const S1=r64(e,14)^r64(e,18)^r64(e,41),ch=(e&f)^(~e&MASK&g);
        const t1=add64(h,S1,ch,K[j],W[j]);
        const S0=r64(a,28)^r64(a,34)^r64(a,39),maj=(a&b)^(a&c)^(b&c);
        const t2=add64(S0,maj);
        h=g;g=f;f=e;e=add64(d,t1);d=c;c=b;b=a;a=add64(t1,t2);
      }
      H=H.map((v,idx)=>add64(v,[a,b,c,d,e,f,g,h][idx]));
    }
    return H.map(h=>h.toString(16).padStart(16,'0')).join('');
  }

  // === Commands — non-crypto ===

  const hash_crc32 = new Command({
    name: "hash_crc32",
    parameters: [new Parameter({type:"string",name:"text",helpText:"Text to hash",default:"hello"})],
    type: "replaceLine",
    helpText: "CRC32 hash of the given text (8-char hex).",
    tutorials: [new TutorialCommand({command:'hash_crc32("hello")',description:"CRC32 of 'hello'"})],
    extension: extensionRoot
  });
  hash_crc32.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) return new ReturnObject({status:"error",message:"Provide text to hash."});
    return new ReturnObject({status:"success",message:"CRC32 calculated.",payload:crc32(String(text))});
  };

  const hash_fnv1a = new Command({
    name: "hash_fnv1a",
    parameters: [new Parameter({type:"string",name:"text",helpText:"Text to hash",default:"hello"})],
    type: "replaceLine",
    helpText: "FNV-1a 32-bit hash (8-char hex).",
    tutorials: [new TutorialCommand({command:'hash_fnv1a("hello")',description:"FNV-1a of 'hello'"})],
    extension: extensionRoot
  });
  hash_fnv1a.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) return new ReturnObject({status:"error",message:"Provide text to hash."});
    return new ReturnObject({status:"success",message:"FNV-1a calculated.",payload:fnv1a32(String(text))});
  };

  const hash_djb2 = new Command({
    name: "hash_djb2",
    parameters: [new Parameter({type:"string",name:"text",helpText:"Text to hash",default:"hello"})],
    type: "replaceLine",
    helpText: "djb2 hash (8-char hex).",
    tutorials: [new TutorialCommand({command:'hash_djb2("hello")',description:"djb2 of 'hello'"})],
    extension: extensionRoot
  });
  hash_djb2.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) return new ReturnObject({status:"error",message:"Provide text to hash."});
    return new ReturnObject({status:"success",message:"djb2 calculated.",payload:djb2(String(text))});
  };

  const hash_adler32 = new Command({
    name: "hash_adler32",
    parameters: [new Parameter({type:"string",name:"text",helpText:"Text to hash",default:"hello"})],
    type: "replaceLine",
    helpText: "Adler-32 checksum (8-char hex).",
    tutorials: [new TutorialCommand({command:'hash_adler32("hello")',description:"Adler-32 of 'hello'"})],
    extension: extensionRoot
  });
  hash_adler32.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) return new ReturnObject({status:"error",message:"Provide text to hash."});
    return new ReturnObject({status:"success",message:"Adler-32 calculated.",payload:adler32(String(text))});
  };

  // === Commands — crypto ===

  const hash_md5 = new Command({
    name: "hash_md5",
    parameters: [new Parameter({type:"string",name:"text",helpText:"Text to hash",default:"hello"})],
    type: "replaceLine",
    helpText: "MD5 hash (32-char hex). Not collision-resistant; use for checksums only.",
    tutorials: [
      new TutorialCommand({command:'hash_md5("hello")',description:"MD5 of 'hello' → 5d41402abc4b2a76b9719d911017c592"}),
      new TutorialCommand({command:'hash_md5("Hello World")',description:"MD5 of 'Hello World'"})
    ],
    extension: extensionRoot
  });
  hash_md5.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) return new ReturnObject({status:"error",message:"Provide text to hash."});
    return new ReturnObject({status:"success",message:"MD5 calculated.",payload:md5(String(text))});
  };

  const hash_sha1 = new Command({
    name: "hash_sha1",
    parameters: [new Parameter({type:"string",name:"text",helpText:"Text to hash",default:"hello"})],
    type: "replaceLine",
    helpText: "SHA-1 hash (40-char hex).",
    tutorials: [
      new TutorialCommand({command:'hash_sha1("hello")',description:"SHA-1 of 'hello' → aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d"})
    ],
    extension: extensionRoot
  });
  hash_sha1.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) return new ReturnObject({status:"error",message:"Provide text to hash."});
    return new ReturnObject({status:"success",message:"SHA-1 calculated.",payload:sha1(String(text))});
  };

  const hash_sha256 = new Command({
    name: "hash_sha256",
    parameters: [new Parameter({type:"string",name:"text",helpText:"Text to hash",default:"hello"})],
    type: "replaceLine",
    helpText: "SHA-256 hash (64-char hex).",
    tutorials: [
      new TutorialCommand({command:'hash_sha256("hello")',description:"SHA-256 of 'hello'"})
    ],
    extension: extensionRoot
  });
  hash_sha256.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) return new ReturnObject({status:"error",message:"Provide text to hash."});
    return new ReturnObject({status:"success",message:"SHA-256 calculated.",payload:sha256(String(text))});
  };

  const hash_sha512 = new Command({
    name: "hash_sha512",
    parameters: [new Parameter({type:"string",name:"text",helpText:"Text to hash",default:"hello"})],
    type: "replaceLine",
    helpText: "SHA-512 hash (128-char hex).",
    tutorials: [
      new TutorialCommand({command:'hash_sha512("hello")',description:"SHA-512 of 'hello'"})
    ],
    extension: extensionRoot
  });
  hash_sha512.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) return new ReturnObject({status:"error",message:"Provide text to hash."});
    return new ReturnObject({status:"success",message:"SHA-512 calculated.",payload:sha512(String(text))});
  };

  // === hash_all ===

  const hash_all = new Command({
    name: "hash_all",
    parameters: [new Parameter({type:"string",name:"text",helpText:"Text to hash",default:"hello"})],
    type: "insert",
    helpText: "Show all hashes: CRC32, FNV-1a, djb2, Adler-32, MD5, SHA-1, SHA-256, SHA-512.",
    tutorials: [
      new TutorialCommand({command:'hash_all("hello")',description:"All hashes for 'hello'"}),
      new TutorialCommand({command:'hash_all("Hello World")',description:"All hashes for 'Hello World'"})
    ],
    extension: extensionRoot
  });
  hash_all.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (text === undefined || text === null) return new ReturnObject({status:"error",message:"Provide text to hash."});
    const s = String(text);
    const lines = [
      `CRC32:   ${crc32(s)}`,
      `FNV-1a:  ${fnv1a32(s)}`,
      `djb2:    ${djb2(s)}`,
      `Adler32: ${adler32(s)}`,
      `MD5:     ${md5(s)}`,
      `SHA-1:   ${sha1(s)}`,
      `SHA-256: ${sha256(s)}`,
      `SHA-512: ${sha512(s)}`
    ];
    return new ReturnObject({status:"success",message:"All hashes calculated.",payload:lines.join('\n')});
  };

})();
