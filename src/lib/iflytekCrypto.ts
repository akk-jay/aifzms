/**
 * Generate iFlytek RTASR authentication signature.
 * API: https://www.xfyun.cn/doc/asr/rtasr/API.html
 *
 * URL format: wss://rtasr.xfyun.cn/v1/ws?appid=xxx&ts=xxx&signa=xxx
 * signa = base64( HMAC-SHA256(apiSecret, signature_origin) )
 */
export async function buildIflytekUrl(config: {
  appId: string;
  apiKey: string;
  apiSecret: string;
}): Promise<string> {
  const host = "rtasr.xfyun.cn";

  // Build RFC 1123 date (UTC)
  const now = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${days[now.getUTCDay()]}, ${p(now.getUTCDate())} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()} ${p(now.getUTCHours())}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())} GMT`;

  // Signature origin string
  const signatureOrigin = `host: ${host}\ndate: ${dateStr}\nGET /v1/ws HTTP/1.1`;

  // HMAC-SHA256
  const enc = new TextEncoder();
  const keyData = enc.encode(config.apiSecret);
  const msgData = enc.encode(signatureOrigin);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBytes = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const signa = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));

  // Build URL - ts in seconds, signa URL-encoded
  const ts = Math.floor(Date.now() / 1000);
  // Manually encode base64 special chars without full URI encoding (keeps the rest intact)
  const signaSafe = signa.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const url = `wss://${host}/v1/ws?appid=${config.appId}&ts=${ts}&signa=${signaSafe}&pd=general`;

  return url;
}
