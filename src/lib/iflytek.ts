interface IflytekConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

export class IflytekASR {
  private ws: WebSocket | null = null;
  private config: IflytekConfig;
  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor(config: IflytekConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const hostUrl = "wss://rtasr.xfyun.cn/v1/ws";
      const url = `${hostUrl}?appid=${this.config.appId}&ts=${Date.now()}&signa=&pd=general`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        const startFrame = {
          common: { app_id: this.config.appId },
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
        this.ws?.send(JSON.stringify(startFrame));
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.code !== 0) {
            this.onErrorCallback?.(msg.message || "ASR error");
            return;
          }
          if (msg.data?.result) {
            const text = msg.data.result.text || "";
            const isFinal = msg.data.status === 2;
            this.onResultCallback?.(text, isFinal);
          }
        } catch {
          // Ignore parse errors for binary frames
        }
      };

      this.ws.onerror = () => {
        this.onErrorCallback?.("WebSocket connection error");
        reject(new Error("WebSocket connection failed"));
      };

      this.ws.onclose = () => {};
    });
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const frame = {
        data: {
          status: 1,
          format: "audio/L16;rate=16000",
          encoding: "raw",
          audio: arrayBufferToBase64(audioData),
        },
      };
      this.ws.send(JSON.stringify(frame));
    }
  }

  sendEnd(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const frame = {
        data: {
          status: 2,
          format: "audio/L16;rate=16000",
          encoding: "raw",
          audio: "",
        },
      };
      this.ws.send(JSON.stringify(frame));
    }
  }

  onResult(callback: (text: string, isFinal: boolean) => void): void {
    this.onResultCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  close(): void {
    this.sendEnd();
    this.ws?.close();
    this.ws = null;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
