import { useEffect, useCallback, useRef } from "react";
import { useInterviewStore } from "../src/stores/interviewStore";
import { AudioCapture } from "../src/lib/audioCapture";
import { IflytekASR } from "../src/lib/iflytek";
import { DeepSeekClient } from "../src/lib/deepseek";

function getConfig() {
  try {
    const raw = localStorage.getItem("app_config");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    iflytek: { appId: "", apiKey: "", apiSecret: "" },
    deepseek: {
      apiKey: "sk-placeholder",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      maxTokens: 2000,
      temperature: 0.7,
    },
    interview: { position: "前端", language: "TypeScript" },
  };
}

export default function OverlayApp() {
  const {
    state,
    currentQuestion,
    currentAnswer,
    partialTranscript,
    setState,
    setCurrentQuestion,
    setCurrentAnswer,
    setPartialTranscript,
    addToHistory,
    resetOverlay,
  } = useInterviewStore();

  const audioCaptureRef = useRef<AudioCapture | null>(null);
  const asrRef = useRef<IflytekASR | null>(null);
  const fullTranscriptRef = useRef("");

  const startRecording = useCallback(async () => {
    const config = getConfig();
    const audioCapture = new AudioCapture();
    const asr = new IflytekASR(config.iflytek);

    fullTranscriptRef.current = "";

    asr.onResult((text, isFinal) => {
      if (isFinal) {
        fullTranscriptRef.current += text;
        setPartialTranscript(fullTranscriptRef.current);
      } else {
        setPartialTranscript(fullTranscriptRef.current + text);
      }
    });

    asr.onError((err) => {
      console.error("ASR error:", err);
    });

    try {
      await asr.connect();
      await audioCapture.start();
      audioCapture.onAudioData((buffer) => {
        asr.sendAudio(buffer);
      });
      audioCaptureRef.current = audioCapture;
      asrRef.current = asr;
      setState("recording");
    } catch (err) {
      console.error("Failed to start recording:", err);
      setState("idle");
    }
  }, [setState, setPartialTranscript]);

  const stopRecordingAndGenerate = useCallback(async () => {
    audioCaptureRef.current?.stop();
    asrRef.current?.close();

    const question = fullTranscriptRef.current.trim();
    if (!question) {
      setState("idle");
      return;
    }

    setCurrentQuestion(question);
    setState("generating");

    const config = getConfig();
    const dsClient = new DeepSeekClient(config.deepseek);

    try {
      let answerText = "";
      await dsClient.generateAnswerStream(
        question,
        (token) => {
          answerText += token;
          setCurrentAnswer(answerText);
        },
        {
          position: config.interview.position,
          language: config.interview.language,
        }
      );

      setCurrentAnswer(answerText);
      setState("displaying");

      addToHistory({
        question,
        answer: answerText,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to generate answer:", err);
      setCurrentAnswer("生成回答失败，请检查 DeepSeek API 配置");
      setState("displaying");
    }
  }, [setState, setCurrentQuestion, setCurrentAnswer, addToHistory]);

  const nextRound = useCallback(() => {
    resetOverlay();
    startRecording();
  }, [resetOverlay, startRecording]);

  // Space key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        switch (state) {
          case "idle":
            startRecording();
            break;
          case "recording":
            stopRecordingAndGenerate();
            break;
          case "displaying":
            nextRound();
            break;
          case "generating":
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, startRecording, stopRecordingAndGenerate, nextRound]);

  // Sync to localStorage for record window
  useEffect(() => {
    const unsub = useInterviewStore.subscribe((s) => {
      localStorage.setItem("interview_history", JSON.stringify(s.qaHistory));
      localStorage.setItem("interview_state", JSON.stringify({
        state: s.state,
        currentQuestion: s.currentQuestion,
        currentAnswer: s.currentAnswer,
        partialTranscript: s.partialTranscript,
      }));
    });
    return () => unsub();
  }, []);

  return (
    <div className="h-screen w-screen bg-black/70 text-white flex flex-col p-4 select-none" data-tauri-drag-region>
      {/* Status bar */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-xs text-gray-400">
          {state === "idle" && "⏸️ 等待中 | 空格开始"}
          {state === "recording" && "🎙️ 录音中 | 空格停止"}
          {state === "generating" && "🤖 AI 生成中..."}
          {state === "displaying" && "📋 空格开始下一轮"}
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {(state === "recording" || state === "generating" || state === "displaying") && (
          <div className="bg-white/10 rounded-xl p-3 border-l-2 border-blue-400">
            <p className="text-xs text-blue-300 mb-1">面试官问题：</p>
            {state === "recording" ? (
              <p className="text-sm text-white">
                {partialTranscript || "正在听取..."}
                <span className="animate-pulse text-blue-400"> ▍</span>
              </p>
            ) : (
              <p className="text-sm text-white">{currentQuestion}</p>
            )}
          </div>
        )}

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
