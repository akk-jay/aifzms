/**
 * iFlytek 实时语音转写大模型 (ASR LLM) 鉴权
 * Endpoint: wss://office-api-ast-dx.iflyaisol.com/ast/communicate/v1
 * Auth: HmacSHA1 signature over sorted URL params
 */
import CryptoJS from "crypto-js";

function uuid(): string {
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function utcString(): string {
  const d = new Date();
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const h = String(Math.abs(offset) / 60 | 0).padStart(2, "0");
  const m = String(Math.abs(offset) % 60).padStart(2, "0");
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}${sign}${h}${m}`;
}

export async function buildIflytekUrl(config: {
  appId: string;
  apiKey: string;     // = accessKeyId
  apiSecret: string;  // = accessKeySecret
}): Promise<string> {
  const params: Record<string, string> = {
    accessKeyId: config.apiKey,
    appId: config.appId,
    audio_encode: "pcm_s16le",
    lang: "autodialect",
    samplerate: "16000",
    utc: utcString(),
    uuid: uuid(),
  };

  // Sort keys alphabetically, URL-encode key and value, join with &
  const baseString = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");

  // HmacSHA1 with accessKeySecret, Base64 encode
  const signature = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA1(baseString, config.apiSecret)
  );

  const query = `${baseString}&signature=${encodeURIComponent(signature)}`;
  return `wss://office-api-ast-dx.iflyaisol.com/ast/communicate/v1?${query}`;
}
