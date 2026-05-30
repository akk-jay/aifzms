/**
 * Raw PCM audio capture — 16kHz, 16bit, mono
 * Buffers small worklet chunks into 40ms frames for iFlytek
 */
export class AudioCapture {
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private onData: ((buf: ArrayBuffer) => void) | null = null;
  private _recording = false;

  // Buffer to accumulate 40ms of audio (640 samples * 2 bytes = 1280 bytes)
  private buffer: ArrayBuffer[] = [];
  private bufferBytes = 0;
  private readonly TARGET_BYTES = 1280; // 40ms @ 16kHz mono 16bit
  private flushInterval: number | null = null;

  async start(): Promise<void> {
    console.log("[Audio] Requesting microphone...");
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

    const actualRate = this.stream.getAudioTracks()[0]?.getSettings()?.sampleRate;
    console.log(`[Audio] Mic opened. Rate: ${actualRate}Hz → AudioContext resamples to 16000Hz`);

    this.audioCtx = new AudioContext({ sampleRate: 16000 });
    this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream);

    // Inline AudioWorklet: float32 → int16 PCM
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
      console.warn("[Audio] Worklet failed:", e);
      // Fallback to ScriptProcessor
    }

    this.buffer = [];
    this.bufferBytes = 0;
    let frameCount = 0;

    const sendExactFrame = () => {
      if (!this.onData) return;
      const targetSize = this.TARGET_BYTES;
      let frame: ArrayBuffer;

      if (this.bufferBytes >= targetSize) {
        // Merge buffer up to exactly targetSize
        const data = new Uint8Array(targetSize);
        let copied = 0;
        while (copied < targetSize && this.buffer.length > 0) {
          const chunk = this.buffer[0];
          const remaining = targetSize - copied;
          if (chunk.byteLength <= remaining) {
            data.set(new Uint8Array(chunk), copied);
            copied += chunk.byteLength;
            this.buffer.shift();
          } else {
            data.set(new Uint8Array(chunk.slice(0, remaining)), copied);
            this.buffer[0] = chunk.slice(remaining);
            copied = targetSize;
          }
        }
        this.bufferBytes -= targetSize;
        frame = data.buffer;
      } else {
        // Pad with silence (zeros)
        const data = new Uint8Array(targetSize);
        if (this.bufferBytes > 0) {
          let offset = 0;
          for (const chunk of this.buffer) {
            data.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
          }
          this.buffer = [];
          this.bufferBytes = 0;
        }
        frame = data.buffer;
      }
      frameCount++;
      if (frameCount % 25 === 0) console.log(`[Audio] Sent ${frameCount} frames (${frame.byteLength}B)`);
      this.onData(frame);
    };

    if (this.audioCtx.audioWorklet && typeof AudioWorkletNode !== "undefined") {
      this.workletNode = new AudioWorkletNode(this.audioCtx, "pcm-proc");
      this.workletNode.port.onmessage = (e) => {
        this.buffer.push(e.data.pcm);
        this.bufferBytes += e.data.pcm.byteLength;
      };
      this.sourceNode.connect(this.workletNode);
    } else {
      const processor = this.audioCtx.createScriptProcessor(640, 1, 1);
      processor.onaudioprocess = (event) => {
        const ch = event.inputBuffer.getChannelData(0);
        const pcm = new ArrayBuffer(ch.length * 2);
        const view = new DataView(pcm);
        for (let i = 0; i < ch.length; i++) {
          let s = Math.max(-1, Math.min(1, ch[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        this.buffer.push(pcm);
        this.bufferBytes += pcm.byteLength;
      };
      this.sourceNode.connect(processor);
      processor.connect(this.audioCtx.destination);
    }

    // Send exactly 1280 bytes every 40ms = 40ms of audio at 16kHz mono 16bit
    this.flushInterval = window.setInterval(sendExactFrame, 40);

    this._recording = true;
    console.log("[Audio] Capture started, target: 1280B/40ms frames");
  }

  onAudioData(callback: (buffer: ArrayBuffer) => void): void {
    this.onData = callback;
  }

  stop(): void {
    console.log("[Audio] Stopping...");
    this._recording = false;
    if (this.flushInterval) clearInterval(this.flushInterval);
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
