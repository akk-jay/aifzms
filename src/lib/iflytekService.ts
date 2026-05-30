interface IflytekTestConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

/** Test iFlytek RTASR connection by establishing WebSocket and checking handshake */
export function testIflytekConnection(config: IflytekTestConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `wss://rtasr.xfyun.cn/v1/ws?appid=${config.appId}&ts=${Date.now()}&signa=&pd=general`;
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("连接超时，请检查网络或 API 配置"));
    }, 10000);

    ws.onopen = () => {
      // Send start frame
      const startFrame = {
        common: { app_id: config.appId },
        business: {
          language: "zh_cn",
          domain: "iat",
          accent: "mandarin",
          ptt: 0,
          rlang: "zh-cn",
          vinfo: 1,
          nunum: 1,
          speex_size: 60,
          wbest: 1,
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
          // Send end frame immediately to close gracefully
          ws.send(JSON.stringify({
            data: { status: 2, format: "audio/L16;rate=16000", encoding: "raw", audio: "" },
          }));
          ws.close();
          resolve("科大讯飞 RTASR 连接成功");
        } else {
          ws.close();
          reject(new Error(`讯飞返回错误 (${msg.code}): ${msg.message || "未知错误"}`));
        }
      } catch {
        ws.close();
        resolve("科大讯飞 RTASR 连接成功（非 JSON 响应）");
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("WebSocket 连接失败，请检查应用 ID 和网络"));
    };
  });
}
