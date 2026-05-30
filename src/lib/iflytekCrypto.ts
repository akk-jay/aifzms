/**
 * Generate iFlytek RTASR authentication using HMAC-SHA256.
 * API: https://www.xfyun.cn/doc/asr/rtasr/API.html
 */
async function generateAuth(apiKey: string, apiSecret: string): Promise<{
  host: string;
  date: string;
  authorization: string;
}> {
  const host = "rtasr.xfyun.cn";

  // RFC 1123 date (UTC)
  const now = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p = (n: number) => String(n).padStart(2, "0");
  const date = `${days[now.getUTCDay()]}, ${p(now.getUTCDate())} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()} ${p(now.getUTCHours())}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())} GMT`;

  // Signature origin: host, date, request-line
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v1/ws HTTP/1.1`;

  // HMAC-SHA256 sign with apiSecret
  const enc = new TextEncoder();
  const keyData = enc.encode(apiSecret);
  const msgData = enc.encode(signatureOrigin);

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const signature = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));

  // Authorization header (base64 encoded)
  const authRaw = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = btoa(authRaw);

  return { host, date, authorization };
}

/** Build the complete WebSocket URL with authentication */
export async function buildIflytekUrl(config: {
  appId: string;
  apiKey: string;
  apiSecret: string;
}): Promise<string> {
  const { host, date, authorization } = await generateAuth(config.apiKey, config.apiSecret);

  const params = new URLSearchParams();
  params.set("appid", config.appId);
  params.set("ts", String(Math.floor(Date.now() / 1000)));
  params.set("host", host);
  params.set("date", date);
  params.set("authorization", authorization);

  return `wss://${host}/v1/ws?${params.toString()}`;
}
