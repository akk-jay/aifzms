/**
 * Raw PCM audio capture — 16kHz, 16bit, mono
 * Sends small chunks immediately for low-latency streaming
 */
export class AudioCapture {
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private onData: ((buf: ArrayBuffer) => void) | null = null;
  private _recording = false;

  async start(): Promise<void> {
    console.log("[Audio] Starting low-latency capture...");
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: { ideal: 16000 }, echoCancellation: true, noiseSuppression: true },
      });
    } catch (e: unknown) {
      const err = e as DOMException;
      if (err.name === "NotAllowedError") throw new Error("麦克风权限被拒绝");
      if (err.name === "NotFoundError") throw new Error("未检测到麦克风");
      throw new Error(`麦克风启动失败: ${err.message}`);
    }

    this.audioCtx = new AudioContext({ sampleRate: 16000 });
    this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream);

    const workletCode = `
      class PcmProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const ch = inputs[0]?.[0];
          if (!ch) return true;
          const buf = new ArrayBuffer(ch.length * 2);
          const v = new DataView(buf);
          for (let i = 0; i < ch.length; i++) {
            let s = Math.max(-1, Math.min(1, ch[i]));
            v.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
          }
          this.port.postMessage({ pcm: buf }, [buf]);
          return true;
        }
      }
      registerProcessor('pcm-proc', PcmProcessor);
    `;

    try {
      const blob = new Blob([workletCode], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      await this.audioCtx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("[Audio] Worklet failed, fallback to ScriptProcessor:", e);
    }

    let sentCount = 0;

    if (this.audioCtx.audioWorklet && typeof AudioWorkletNode !== "undefined") {
      this.workletNode = new AudioWorkletNode(this.audioCtx, "pcm-proc");
      this.workletNode.port.onmessage = (e) => {
        if (!this.onData) return;
        this.onData(e.data.pcm); // Send immediately, no buffering
        sentCount++;
        if (sentCount % 25 === 0) {
          console.log(`[Audio] Sent ${sentCount} chunks (${e.data.pcm.byteLength}B each, ~8ms latency)`);
        }
      };
      this.sourceNode.connect(this.workletNode);
    } else {
      // Fallback: small ScriptProcessor chunks
      const processor = this.audioCtx.createScriptProcessor(256, 1, 1);
      processor.onaudioprocess = (event) => {
        if (!this.onData) return;
        const ch = event.inputBuffer.getChannelData(0);
        const pcm = new ArrayBuffer(ch.length * 2);
        const view = new DataView(pcm);
        for (let i = 0; i < ch.length; i++) {
          let s = Math.max(-1, Math.min(1, ch[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        this.onData(pcm);
        sentCount++;
        if (sentCount % 50 === 0) console.log(`[Audio] Sent ${sentCount} chunks (${pcm.byteLength}B each)`);
      };
      this.sourceNode.connect(processor);
      processor.connect(this.audioCtx.destination);
    }

    this._recording = true;
    console.log("[Audio] Low-latency streaming started (~8ms chunks)");
  }

  onAudioData(callback: (buffer: ArrayBuffer) => void): void {
    this.onData = callback;
  }

  stop(): void {
    this._recording = false;
    try { this.workletNode?.port?.close(); } catch {}
    try { this.workletNode?.disconnect(); } catch {}
    try { this.sourceNode?.disconnect(); } catch {}
    try { this.stream?.getTracks().forEach((t) => t.stop()); } catch {}
    try { this.audioCtx?.close(); } catch {}
    this.stream = null; this.audioCtx = null; this.sourceNode = null; this.workletNode = null;
    console.log("[Audio] Stopped");
  }

  isRecording(): boolean { return this._recording; }
}
