/**
 * iFlytek RTASR authentication (Chinese domestic API)
 * Formula: signa = base64( HmacSHA1( MD5(appid + ts), apiKey ) )
 *
 * API docs: https://www.xfyun.cn/doc/asr/rtasr/API.html
 */

// Pure JS MD5 (browser Web Crypto doesn't support MD5)
function md5Hex(input: string): string {
  function rotateLeft(n: number, s: number) { return (n << s) | (n >>> (32 - s)); }
  function toHex(n: number) {
    let h = "";
    for (let i = 0; i < 4; i++) h += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
    return h;
  }
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) bytes.push(input.charCodeAt(i) & 0xff);
  const origLen = bytes.length;
  bytes.push(0x80);
  while ((bytes.length + 8) % 64 !== 0) bytes.push(0);
  const bitLen = origLen * 8;
  for (let i = 0; i < 8; i++) bytes.push((bitLen >>> (i * 8)) & 0xff);

  const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const K: number[] = [];
  for (let i = 0; i < 64; i++) K.push(Math.floor(Math.abs(Math.sin(i + 1)) * Math.pow(2, 32)));

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const M: number[] = [];
    for (let i = 0; i < 16; i++) M[i] = bytes[offset + i * 4] | (bytes[offset + i * 4 + 1] << 8) | (bytes[offset + i * 4 + 2] << 16) | (bytes[offset + i * 4 + 3] << 24);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      const temp = D;
      D = C; C = B;
      B = B + rotateLeft(A + F + K[i] + M[g], S[i]);
      A = temp;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }
  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

// HMAC-SHA1 using Web Crypto (browser supports SHA-1)
async function hmacSha1Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const msgData = enc.encode(message);

  // Web Crypto HMAC-SHA1 returns ArrayBuffer
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert hex to base64
function hexToBase64(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return btoa(String.fromCharCode(...bytes));
}

/** Build the WebSocket URL with proper RTASR authentication */
export async function buildIflytekUrl(config: {
  appId: string;
  apiKey: string;
  apiSecret: string;
}): Promise<string> {
  const host = "rtasr.xfyun.cn";
  const ts = Math.floor(Date.now() / 1000).toString();

  // signa = base64( HmacSHA1( MD5(appid + ts), api_key ) )
  const md5 = md5Hex(config.appId + ts);
  const hmacHex = await hmacSha1Hex(config.apiKey, md5);
  const signa = hexToBase64(hmacHex);

  return `wss://${host}/v1/ws?appid=${config.appId}&ts=${ts}&signa=${encodeURIComponent(signa)}`;
}
