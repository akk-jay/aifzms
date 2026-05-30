/**
 * Generate iFlytek RTASR authentication signature using HMAC-SHA256.
 * API docs: https://www.xfyun.cn/doc/asr/rtasr/API.html
 */
async function generateSignature(apiSecret: string, apiKey: string): Promise<{ dateStr: string; signatureBase64: string; authorizationBase64: string }> {
  // RFC 1123 date format
  const now = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${days[now.getUTCDay()]}, ${pad(now.getUTCDate())} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} GMT`;

  const signatureOrigin = `host: rtasr.xfyun.cn\ndate: ${dateStr}\nGET /v1/ws HTTP/1.1`;

  // Use Web Crypto API for HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(signatureOrigin);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  // Build authorization header value
  const authorization = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`;
  const authorizationBase64 = btoa(authorization);

  return { dateStr, signatureBase64, authorizationBase64 };
}

/** Build the WebSocket URL with proper authentication */
export async function buildIflytekUrl(config: {
  appId: string;
  apiKey: string;
  apiSecret: string;
}): Promise<string> {
  const { dateStr, signatureBase64, authorizationBase64 } = await generateSignature(
    config.apiSecret,
    config.apiKey
  );

  const url = `wss://rtasr.xfyun.cn/v1/ws?appid=${config.appId}&ts=${Date.now()}&signa=${encodeURIComponent(signatureBase64)}&pd=general&date=${encodeURIComponent(dateStr)}&authorization=${encodeURIComponent(authorizationBase64)}`;

  return url;
}
