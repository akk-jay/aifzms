const KEYS = {
  DEEPSEEK_CONFIG: "deepseek_config",
  RESUME: "resume_data",
  RESUME_NAME: "resume_name",
  QA_LIBRARY: "qa_library",
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
  const data: DeepSeekConfigData = {
    ...config,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEYS.DEEPSEEK_CONFIG, JSON.stringify(data));
  return data;
}

export function loadDeepSeekConfig(): DeepSeekConfigData | null {
  try {
    const raw = localStorage.getItem(KEYS.DEEPSEEK_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// ===== Resume =====
export function saveResume(fileName: string, base64Data: string): void {
  localStorage.setItem(KEYS.RESUME_NAME, fileName);
  // Store in chunks for large files
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
  try {
    const raw = localStorage.getItem(KEYS.QA_LIBRARY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}
