import { create } from "zustand";

export type InterviewState = "idle" | "recording" | "generating" | "displaying";

export interface QaItem {
  question: string;
  answer: string;
  timestamp: string;
}

interface InterviewStore {
  state: InterviewState;
  currentQuestion: string;
  currentAnswer: string;
  partialTranscript: string;
  qaHistory: QaItem[];
  setState: (state: InterviewState) => void;
  setPartialTranscript: (text: string) => void;
  setCurrentQuestion: (text: string) => void;
  setCurrentAnswer: (text: string) => void;
  addToHistory: (qa: QaItem) => void;
  resetOverlay: () => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  state: "idle",
  currentQuestion: "",
  currentAnswer: "",
  partialTranscript: "",
  qaHistory: [],

  setState: (state) => set({ state }),
  setPartialTranscript: (text) => set({ partialTranscript: text }),
  setCurrentQuestion: (text) => set({ currentQuestion: text }),
  setCurrentAnswer: (text) => set({ currentAnswer: text }),
  addToHistory: (qa) =>
    set((prev) => ({ qaHistory: [...prev.qaHistory, qa] })),
  resetOverlay: () =>
    set({ currentQuestion: "", currentAnswer: "", partialTranscript: "", state: "idle" }),
}));
