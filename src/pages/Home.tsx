import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startInterviewWindows, saveConfig, type AppConfig } from "@/lib/commands";

const regions = [
  { value: "zh-cn", label: "简体中文" },
  { value: "en-us", label: "English (US)" },
];

const positions = [
  { value: "frontend", label: "前端" },
  { value: "backend", label: "后端" },
  { value: "fullstack", label: "全栈" },
  { value: "devops", label: "DevOps" },
  { value: "data", label: "数据工程师" },
  { value: "mobile", label: "移动端" },
  { value: "ai", label: "AI/ML" },
];

const languages = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "cpp", label: "C++" },
];

export default function Home() {
  const [region, setRegion] = useState("zh-cn");
  const [position, setPosition] = useState("frontend");
  const [language, setLanguage] = useState("typescript");
  const [useCustomQa, setUseCustomQa] = useState("no");
  const [hasResume] = useState(false);

  const handleStartInterview = async () => {
    try {
      const config: AppConfig = {
        iflytek: { appId: "", apiKey: "", apiSecret: "" },
        deepseek: {
          apiKey: "",
          baseUrl: "https://api.deepseek.com",
          model: "deepseek-chat",
          maxTokens: 2000,
          temperature: 0.7,
        },
        interview: {
          region,
          position,
          language,
          customQaEnabled: useCustomQa === "yes",
        },
      };
      try {
        const existing = await invoke("load_config") as string;
        if (existing && existing !== "{}") {
          const parsed = JSON.parse(existing);
          config.iflytek = parsed.iflytek || config.iflytek;
          config.deepseek = parsed.deepseek || config.deepseek;
        }
      } catch { /* use defaults */ }

      await saveConfig(config);
      localStorage.setItem("app_config", JSON.stringify(config));
      localStorage.setItem("interview_history", JSON.stringify([]));
      await startInterviewWindows();
    } catch (err) {
      console.error("Failed to start interview:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">新的面试</h1>
        <p className="text-sm text-gray-500 mt-1">配置面试参数，然后点击"前往面试"开始</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">请选择面试地区和岗位</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="region">地区 <span className="text-red-400">*</span></Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">岗位 <span className="text-red-400">*</span></Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger id="position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          没有想要的岗位？<a href="#" className="text-primary underline">联系小助手一键添加</a>
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">技术定制</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="language">
              编程语言 <span className="text-xs text-gray-400">（仅针对笔试功能）</span>
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customQa">是否使用自定义问答库</Label>
            <Select value={useCustomQa} onValueChange={setUseCustomQa}>
              <SelectTrigger id="customQa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">否</SelectItem>
                <SelectItem value="yes">是</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {useCustomQa === "no" && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-500">当前问答库为空</span>
            <Button variant="outline" size="sm" className="text-primary border-primary">
              创建问答库
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        {!hasResume && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
            你并未上传简历，AI将无法基于简历回答，
            <a href="#" className="underline font-medium">去上传</a>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-600 text-white px-12 py-6 text-base rounded-xl"
            onClick={handleStartInterview}
          >
            前往面试
          </Button>
        </div>
      </div>
    </div>
  );
}
