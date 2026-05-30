/**
 * iFlytek 实时语音转写大模型 (ASR LLM) WebSocket 客户端
 * Endpoint: office-api-ast-dx.iflyaisol.com/ast/communicate/v1
 */
import { buildIflytekUrl } from "./iflytekCrypto";

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
  private sessionStarted = false;
  private _firstAudioSent = false;

  constructor(config: IflytekConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const url = await buildIflytekUrl(this.config);

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        // LLM endpoint: send start message
        this.ws?.send(JSON.stringify({
          msg_type: "start",
          data: {
            audio_encode: "pcm_s16le",
            samplerate: 16000,
            lang: "autodialect",
          },
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("[iFlytek] Received:", JSON.stringify(msg).slice(0, 200));

          // LLM endpoint: msg_type based
          if (msg.msg_type === "action" && msg.data?.action === "started") {
            this.sessionStarted = true;
            resolve();
            return;
          }

          // Result: transcription text
          if (msg.msg_type === "result" && msg.data) {
            const text = msg.data.text || msg.data.content || "";
            const isFinal = msg.data.is_final !== false; // default to true
            this.onResultCallback?.(text, isFinal);
            return;
          }

          // Error
          if (msg.msg_type === "error") {
            const errMsg = msg.data?.message || msg.data?.desc || "ASR error";
            this.onErrorCallback?.(errMsg);
            return;
          }

          // Fallback for standard RTASR format
          if (msg.code !== undefined && msg.code !== 0) {
            this.onErrorCallback?.(msg.message || "ASR error");
            return;
          }
          if (msg.data?.result?.text) {
            const text = msg.data.result.text;
            const isFinal = msg.data.status === 2;
            this.onResultCallback?.(text, isFinal);
          }
        } catch {
          // Ignore binary frames
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
    if (this.ws?.readyState === WebSocket.OPEN && this.sessionStarted) {
      const bytes = new Uint8Array(audioData);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      if (!this._firstAudioSent) {
        console.log("[iFlytek] First audio frame:", bytes.length, "bytes PCM, base64 length:", base64.length);
        this._firstAudioSent = true;
      }

      this.ws.send(JSON.stringify({
        msg_type: "audio",
        data: {
          audio: base64,
          audio_encode: "pcm_s16le",
          samplerate: 16000,
        },
      }));
    }
  }

  sendEnd(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ msg_type: "end" }));
      this.sessionStarted = false;
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
