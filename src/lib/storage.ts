const KEYS = {
  DEEPSEEK_CONFIG: "deepseek_config",
  IFLYTEK_CONFIG: "iflytek_config",
  RESUME: "resume_data",
  RESUME_NAME: "resume_name",
  QA_LIBRARY: "qa_library",
  INTERVIEW_CONTEXT: "interview_context",
} as const;

// ===== DeepSeek Config =====
export interface DeepSeekConfigData {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  savedAt: string;
}

export function saveDeepSeekConfig(config: Omit<DeepSeekConfigData, "savedAt">): DeepSeekConfigData {
  const data: DeepSeekConfigData = { ...config, savedAt: new Date().toISOString() };
  localStorage.setItem(KEYS.DEEPSEEK_CONFIG, JSON.stringify(data));
  return data;
}

export function loadDeepSeekConfig(): DeepSeekConfigData | null {
  try { const raw = localStorage.getItem(KEYS.DEEPSEEK_CONFIG); if (raw) return JSON.parse(raw); } catch {}
  return null;
}

// ===== iFlytek Config =====
export interface IflytekConfigData {
  appId: string;
  apiKey: string;
  apiSecret: string;
  savedAt: string;
}

export function saveIflytekConfig(config: Omit<IflytekConfigData, "savedAt">): IflytekConfigData {
  const data: IflytekConfigData = { ...config, savedAt: new Date().toISOString() };
  localStorage.setItem(KEYS.IFLYTEK_CONFIG, JSON.stringify(data));
  return data;
}

export function loadIflytekConfig(): IflytekConfigData | null {
  try { const raw = localStorage.getItem(KEYS.IFLYTEK_CONFIG); if (raw) return JSON.parse(raw); } catch {}
  return null;
}

export function deleteIflytekConfig(): void {
  localStorage.removeItem(KEYS.IFLYTEK_CONFIG);
}

// ===== Resume =====
export function saveResume(fileName: string, base64Data: string): void {
  localStorage.setItem(KEYS.RESUME_NAME, fileName);
  const chunkSize = 50000;
  const chunks: string[] = [];
  for (let i = 0; i < base64Data.length; i += chunkSize) {
    chunks.push(base64Data.slice(i, i + chunkSize));
  }
  localStorage.setItem(KEYS.RESUME, JSON.stringify(chunks));
}

export function loadResume(): { fileName: string; data: string } | null {
  try {
    const name = localStorage.getItem(KEYS.RESUME_NAME);
    const chunksRaw = localStorage.getItem(KEYS.RESUME);
    if (name && chunksRaw) {
      const chunks = JSON.parse(chunksRaw) as string[];
      return { fileName: name, data: chunks.join("") };
    }
  } catch {}
  return null;
}

export function deleteResume(): void {
  localStorage.removeItem(KEYS.RESUME_NAME);
  localStorage.removeItem(KEYS.RESUME);
}

// ===== QA Library =====
export interface QAItem {
  id: string;
  question: string;
  answer: string;
}

export function saveQALibrary(items: QAItem[]): void {
  localStorage.setItem(KEYS.QA_LIBRARY, JSON.stringify(items));
}

export function loadQALibrary(): QAItem[] {
  try { const raw = localStorage.getItem(KEYS.QA_LIBRARY); if (raw) return JSON.parse(raw); } catch {}
  return [];
}

// ===== Interview Context =====
export interface InterviewContext {
  resumeName: string | null;
  qaCount: number;
  position: string;
  startedAt: string;
}

export function saveInterviewContext(ctx: InterviewContext): void {
  localStorage.setItem(KEYS.INTERVIEW_CONTEXT, JSON.stringify(ctx));
}

export function loadInterviewContext(): InterviewContext | null {
  try { const raw = localStorage.getItem(KEYS.INTERVIEW_CONTEXT); if (raw) return JSON.parse(raw); } catch {}
  return null;
}
