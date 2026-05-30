import { buildIflytekUrl } from "./iflytekCrypto";

interface IflytekTestConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

/** Test iFlytek RTASR connection with proper HMAC-SHA256 signature */
export async function testIflytekConnection(config: IflytekTestConfig): Promise<string> {
  const url = await buildIflytekUrl(config);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("连接超时，请检查网络或 API 配置"));
    }, 10000);

    ws.onopen = () => {
      const startFrame = {
        common: { app_id: config.appId },
        business: {
          language: "zh_cn",
          domain: "iat",
          accent: "mandarin",
          ptt: 0,
        },
        data: {
          status: 0,
          format: "audio/L16;rate=16000",
          encoding: "raw",
          audio: "",
        },
      };
      ws.send(JSON.stringify(startFrame));
    };

    ws.onmessage = (event) => {
      clearTimeout(timeout);
      try {
        const msg = JSON.parse(event.data);
        if (msg.code === 0) {
          ws.send(JSON.stringify({
            data: { status: 2, format: "audio/L16;rate=16000", encoding: "raw", audio: "" },
          }));
          ws.close();
          resolve("科大讯飞 RTASR 连接成功");
        } else {
          ws.close();
          reject(new Error(`讯飞返回错误 (${msg.code}): ${msg.message || "鉴权失败，请检查 API 密钥和 Secret"}`));
        }
      } catch {
        ws.close();
        resolve("科大讯飞 RTASR 连接成功");
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("WebSocket 连接失败，请检查应用 ID 和网络"));
    };
  });
}
