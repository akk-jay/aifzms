import { useEffect, useCallback, useRef } from "react";
import { useInterviewStore } from "../src/stores/interviewStore";
import { AudioCapture } from "../src/lib/audioCapture";
import { IflytekASR } from "../src/lib/iflytek";
import { DeepSeekClient } from "../src/lib/deepseek";

// ============ Config Helpers ============

function getFullConfig() {
  let config = {
    iflytek: { appId: "", apiKey: "", apiSecret: "" },
    deepseek: { apiKey: "", baseUrl: "https://api.deepseek.com", model: "deepseek-chat", maxTokens: 2000, temperature: 0.7 },
    interview: { position: "项目管理", language: "TypeScript" },
  };
  // Read config from URL hash (passed by Rust when creating window)
  try {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const json = atob(hash.replace(/-/g, "+").replace(/_/g, "/"));
      const parsed = JSON.parse(json);
      config = { ...config, ...parsed };
    }
  } catch { /* ignore */ }
  // Fallback: localStorage (for browser testing)
  if (!config.iflytek.apiKey) {
    try {
      const raw = localStorage.getItem("app_config");
      if (raw) config = { ...config, ...JSON.parse(raw) };
    } catch { /* ignore */ }
  }
  return config;
}

function buildInterviewContext(): string {
  let ctx = "";
  try {
    const raw = localStorage.getItem("interview_context_full");
    if (!raw) return ctx;
    const data = JSON.parse(raw);
    if (data.resumeName) ctx += `\n应聘者简历：${data.resumeName}`;
    if (data.qaItems?.length > 0) {
      ctx += `\n自定义问答库（${data.qaCount}条）：`;
      data.qaItems.forEach((qa: { question: string; answer: string }) => {
        ctx += `\n- Q: ${qa.question}\n  A: ${qa.answer}`;
      });
    }
  } catch { /* ignore */ }
  return ctx;
}

// ============ OverlayApp ============

export default function OverlayApp() {
  const {
    state, currentQuestion, currentAnswer, partialTranscript,
    setState, setCurrentQuestion, setCurrentAnswer, setPartialTranscript,
    addToHistory, resetOverlay,
  } = useInterviewStore();

  const audioRef = useRef<AudioCapture | null>(null);
  const asrRef = useRef<IflytekASR | null>(null);
  const transcriptRef = useRef("");

  // ===== RECORDING =====
  const startRecording = useCallback(async () => {
    // Set recording state IMMEDIATELY for fast UI response
    setState("recording");
    transcriptRef.current = "";
    setPartialTranscript("正在听取...");
    setCurrentQuestion("");
    setCurrentAnswer("");

    const config = getFullConfig();
    const audio = new AudioCapture();
    const asr = new IflytekASR(config.iflytek);
    audioRef.current = audio;
    asrRef.current = asr;

    asr.onResult((text, isFinal) => {
      if (isFinal) {
        transcriptRef.current += text;
      }
      setPartialTranscript(transcriptRef.current + text);
    });

    asr.onError((err) => {
      console.error("[Overlay] ASR error:", err);
      // Don't stop recording on transient errors
    });

    // Start audio capture (mic) and ASR connection in parallel
    try {
      await Promise.all([audio.start(), asr.connect()]);
      audio.onAudioData((buf) => asr.sendAudio(buf));
    } catch (err) {
      console.error("[Overlay] Failed to start:", err);
      audio.stop();
      asr.close();
      audioRef.current = null;
      asrRef.current = null;
      setState("idle");
    }
  }, [setState, setPartialTranscript, setCurrentQuestion, setCurrentAnswer]);

  // ===== STOP & GENERATE =====
  const stopRecordingAndGenerate = useCallback(async () => {
    // Stop mic and ASR
    audioRef.current?.stop();
    asrRef.current?.close();
    audioRef.current = null;
    asrRef.current = null;

    const question = transcriptRef.current.trim();
    if (!question) {
      // No speech detected, go back to idle
      setState("idle");
      setPartialTranscript("");
      return;
    }

    setCurrentQuestion(question);
    setPartialTranscript("");
    setState("generating");

    const config = getFullConfig();
    console.log("[Overlay] Config loaded:", { hasDsKey: !!config.deepseek?.apiKey, dsBaseUrl: config.deepseek?.baseUrl, hasIflytek: !!config.iflytek?.apiKey });
    const dsClient = new DeepSeekClient(config.deepseek);
    const interviewCtx = buildInterviewContext();
    const prompt = interviewCtx
      ? `[面试者背景资料]\n${interviewCtx}\n\n[当前问题]\n${question}`
      : question;
    console.log("[Overlay] Prompt length:", prompt.length, "hasContext:", !!interviewCtx);

    try {
      let answerText = "";
      await dsClient.generateAnswerStream(
        prompt,
        (token) => {
          answerText += token;
          setCurrentAnswer(answerText);
        },
        { position: config.interview.position, language: config.interview.language }
      );
      setCurrentAnswer(answerText);
      setState("displaying");
      addToHistory({ question, answer: answerText, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error("[Overlay] Generate failed:", err);
      setCurrentAnswer("生成失败: " + (err instanceof Error ? err.message : String(err)));
      setState("displaying");
    }
  }, [setState, setCurrentQuestion, setCurrentAnswer, setPartialTranscript, addToHistory]);

  // ===== NEXT ROUND =====
  const nextRound = useCallback(() => {
    resetOverlay();
    startRecording();
  }, [resetOverlay, startRecording]);

  // ===== Space key handler =====
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        if (state === "idle") startRecording();
        else if (state === "recording") stopRecordingAndGenerate();
        else if (state === "displaying") nextRound();
        // generating: do nothing
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, startRecording, stopRecordingAndGenerate, nextRound]);

  // ===== Sync to localStorage for record window =====
  useEffect(() => {
    const unsub = useInterviewStore.subscribe((s) => {
      localStorage.setItem("interview_history", JSON.stringify(s.qaHistory));
      localStorage.setItem("interview_state", JSON.stringify({
        state: s.state, currentQuestion: s.currentQuestion,
        currentAnswer: s.currentAnswer, partialTranscript: s.partialTranscript,
      }));
    });
    return () => unsub();
  }, []);

  // ===== UI =====
  return (
    <div className="h-screen w-screen bg-black/70 text-white flex flex-col p-4 select-none" data-tauri-drag-region>
      {/* Status bar */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-xs text-gray-400">
          {state === "idle" && "⏸️ 等待中 | 空格开始"}
          {state === "recording" && "🎙️ 录音中 | 空格停止"}
          {state === "generating" && "🤖 AI 生成中..."}
          {state === "displaying" && "📋 空格下一轮"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Question */}
        {(state === "recording" || state === "generating" || state === "displaying") && (
          <div className="bg-white/10 rounded-xl p-3 border-l-2 border-blue-400">
            <p className="text-xs text-blue-300 mb-1">面试官问题：</p>
            {state === "recording" ? (
              <p className="text-sm text-white">
                {partialTranscript || "正在听取..."}
                <span className="animate-pulse text-blue-400"> ▍</span>
              </p>
            ) : (
              <p className="text-sm text-white">{currentQuestion || "(未检测到语音)"}</p>
            )}
          </div>
        )}

        {/* Answer */}
        {(state === "generating" || state === "displaying") && (
          <div className="bg-white/10 rounded-xl p-3 border-l-2 border-green-400">
            <p className="text-xs text-green-300 mb-1">AI 回答：</p>
            {state === "generating" ? (
              <p className="text-sm text-white">
                {currentAnswer || "正在生成..."}
                <span className="animate-pulse text-green-400"> ▍</span>
              </p>
            ) : (
              <p className="text-sm text-white whitespace-pre-wrap">{currentAnswer}</p>
            )}
          </div>
        )}

        {state === "idle" && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">按空格键开始录音</p>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-gray-600 mt-2 shrink-0">
        空格键控制 · 可拖动 · 始终置顶
      </div>
    </div>
  );
}
