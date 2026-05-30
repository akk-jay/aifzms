import { invoke } from "@tauri-apps/api/core";

export interface IflytekConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface InterviewConfig {
  region: string;
  position: string;
  language: string;
  customQaEnabled: boolean;
}

export interface AppConfig {
  iflytek: IflytekConfig;
  deepseek: DeepSeekConfig;
  interview: InterviewConfig;
}

export async function saveConfig(config: AppConfig): Promise<string> {
  return invoke("save_config", { configJson: JSON.stringify(config) });
}

export async function loadConfig(): Promise<string> {
  return invoke("load_config");
}

export async function saveRecord(recordJson: string): Promise<string> {
  return invoke("save_record", { recordJson });
}

export async function loadRecords(): Promise<string> {
  return invoke("load_records");
}

export async function startInterviewWindows(): Promise<string> {
  return invoke("start_interview_windows");
}
