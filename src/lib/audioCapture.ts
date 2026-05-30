/**
 * Raw PCM audio capture using AudioContext + ScriptProcessor
 * Output: 16kHz, 16bit, mono — directly compatible with iFlytek LLM endpoint
 */
export class AudioCapture {
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onDataCallback: ((buffer: ArrayBuffer) => void) | null = null;

  async start(): Promise<void> {
    // Get mic with exact sample rate
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.audioCtx = new AudioContext({ sampleRate: 16000 });
    this.source = this.audioCtx.createMediaStreamSource(this.stream);

    // Downsample to 16kHz mono if needed, then output raw PCM
    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (event) => {
      if (!this.onDataCallback) return;
      const inputData = event.inputBuffer.getChannelData(0);

      // Convert float32 [-1,1] to int16 PCM
      const pcmBuffer = new ArrayBuffer(inputData.length * 2);
      const pcmView = new DataView(pcmBuffer);
      for (let i = 0; i < inputData.length; i++) {
        let sample = Math.max(-1, Math.min(1, inputData[i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        pcmView.setInt16(i * 2, sample, true); // little-endian
      }
      this.onDataCallback(pcmBuffer);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioCtx.destination); // Required by some browsers
  }

  onAudioData(callback: (buffer: ArrayBuffer) => void): void {
    this.onDataCallback = callback;
  }

  stop(): void {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.audioCtx?.close();
    this.stream = null;
    this.audioCtx = null;
    this.processor = null;
    this.source = null;
  }

  isRecording(): boolean {
    return this.stream !== null && this.stream.active;
  }
}
