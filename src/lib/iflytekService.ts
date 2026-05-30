import { buildIflytekUrl } from "./iflytekCrypto";

interface IflytekTestConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

/** Test iFlytek RTASR connection */
export async function testIflytekConnection(config: IflytekTestConfig): Promise<string> {
  // Pre-validate
  if (!config.appId || !config.apiKey || !config.apiSecret) {
    throw new Error("请填写完整的讯飞配置：应用 ID、API 密钥、API Secret");
  }

  const url = await buildIflytekUrl(config);
  console.log("[iFlytek Test] Connecting to:", url.replace(config.appId, "***"));

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("连接超时（10秒），请检查网络"));
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
        console.log("[iFlytek Test] Response:", JSON.stringify(msg));

        // LLM endpoint: msg_type="action" + action="started" = success
        // Error format: code field or msg_type="error"
        if (msg.msg_type === "action" && msg.data?.action === "started") {
          ws.close();
          resolve("科大讯飞实时语音转写大模型 连接成功 ✅");
        } else if (msg.msg_type === "error" || msg.code) {
          ws.close();
          const errMsg = msg.data?.message || msg.message || msg.desc || JSON.stringify(msg);
          reject(new Error(`讯飞错误: ${errMsg}`));
        } else {
          // Unknown response format but connection worked
          ws.close();
          resolve("科大讯飞 连接成功 ✅");
        }
      } catch {
        ws.close();
        resolve("科大讯飞 连接成功 ✅");
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("WebSocket 连接失败。请检查：\n1. 网络是否能访问 rtasr.xfyun.cn\n2. 应用 ID 是否正确\n3. API Secret 是否匹配"));
    };

    ws.onclose = (e) => {
      clearTimeout(timeout);
      if (e.code !== 1000 && e.code !== 1005) {
        reject(new Error(`连接被关闭 (code=${e.code})，可能鉴权未通过`));
      }
    };
  });
}
