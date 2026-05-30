/**
 * Raw PCM audio capture — 16kHz, 16bit, mono
 * Output chunks: ~40ms (640 samples = 1280 bytes)
 */
export class AudioCapture {
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private onData: ((buf: ArrayBuffer) => void) | null = null;
  private _recording = false;

  async start(): Promise<void> {
    console.log("[Audio] Requesting microphone...");
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      });
    } catch (e: unknown) {
      const err = e as DOMException;
      console.error("[Audio] getUserMedia failed:", err.name, err.message);
      if (err.name === "NotAllowedError") throw new Error("麦克风权限被拒绝，请在系统设置中允许");
      if (err.name === "NotFoundError") throw new Error("未检测到麦克风设备");
      throw new Error(`麦克风启动失败: ${err.message}`);
    }

    const actualSampleRate = this.stream.getAudioTracks()[0]?.getSettings()?.sampleRate;
    console.log(`[Audio] Mic opened. Sample rate: ${actualSampleRate}Hz, channels: ${this.stream.getAudioTracks()[0]?.getSettings()?.channelCount}`);

    this.audioCtx = new AudioContext({ sampleRate: 16000 });
    this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream);

    // Use inline AudioWorklet for reliable PCM capture
    const workletCode = `
      class PcmProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const input = inputs[0];
          if (!input || !input[0]) return true;
          const channel = input[0]; // Float32Array, mono
          // Convert to Int16 PCM
          const pcm = new ArrayBuffer(channel.length * 2);
          const view = new DataView(pcm);
          for (let i = 0; i < channel.length; i++) {
            let s = Math.max(-1, Math.min(1, channel[i]));
            s = s < 0 ? s * 0x8000 : s * 0x7FFF;
            view.setInt16(i * 2, s, true);
          }
          this.port.postMessage({ pcm }, [pcm]);
          return true;
        }
      }
      registerProcessor('pcm-processor', PcmProcessor);
    `;

    try {
      const blob = new Blob([workletCode], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      await this.audioCtx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("[Audio] Worklet failed, falling back to ScriptProcessor:", e);
    }

    const bufferSize = 640; // 40ms @ 16kHz
    let chunkCount = 0;

    if (this.audioCtx.audioWorklet && typeof AudioWorkletNode !== "undefined") {
      this.workletNode = new AudioWorkletNode(this.audioCtx, "pcm-processor");
      this.workletNode.port.onmessage = (e) => {
        if (!this.onData) return;
        chunkCount++;
        if (chunkCount % 10 === 0) console.log(`[Audio] Sent ${chunkCount} chunks`);
        this.onData(e.data.pcm);
      };
      this.sourceNode.connect(this.workletNode);
    } else {
      // Fallback
      const processor = this.audioCtx.createScriptProcessor(bufferSize, 1, 1);
      processor.onaudioprocess = (event) => {
        if (!this.onData) return;
        const inputData = event.inputBuffer.getChannelData(0);
        const pcm = new ArrayBuffer(inputData.length * 2);
        const view = new DataView(pcm);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          s = s < 0 ? s * 0x8000 : s * 0x7FFF;
          view.setInt16(i * 2, s, true);
        }
        chunkCount++;
        if (chunkCount % 10 === 0) console.log(`[Audio] Sent ${chunkCount} chunks`);
        this.onData(pcm);
      };
      this.sourceNode.connect(processor);
      processor.connect(this.audioCtx.destination);
    }

    this._recording = true;
    console.log("[Audio] Capture started successfully");
  }

  onAudioData(callback: (buffer: ArrayBuffer) => void): void {
    this.onData = callback;
  }

  stop(): void {
    console.log("[Audio] Stopping...");
    this._recording = false;
    try { this.workletNode?.port?.close(); } catch {}
    try { this.workletNode?.disconnect(); } catch {}
    try { this.sourceNode?.disconnect(); } catch {}
    try { this.stream?.getTracks().forEach((t) => t.stop()); } catch {}
    try { this.audioCtx?.close(); } catch {}
    this.stream = null;
    this.audioCtx = null;
    this.sourceNode = null;
    this.workletNode = null;
    console.log("[Audio] Stopped");
  }

  isRecording(): boolean {
    return this._recording;
  }
}
