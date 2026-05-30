import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { loadResume, saveResume, deleteResume, saveInterviewContext, loadQALibrary } from "@/lib/storage";
import { startInterviewWindows } from "@/lib/commands";
import QALibraryModal from "@/components/QALibraryModal";
import { callDeepSeek } from "@/lib/deepseekService";
import { extractResumeText } from "@/lib/resumeParser";

export default function Home() {
  const [resumeName, setResumeName] = useState<string | null>(() => {
    const r = loadResume();
    return r?.fileName ?? null;
  });
  const [isQAModalOpen, setIsQAModalOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext ?? "")) {
      toast("仅支持 .pdf / .doc / .docx 格式文件", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast("文件大小不能超过 10MB", "error");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1] ?? "";
        saveResume(file.name, base64);
        setResumeName(file.name);
        toast("简历上传成功", "success");
      };
      reader.onerror = () => {
        toast("文件读取失败，请重试", "error");
      };
      reader.readAsDataURL(file);
    } catch {
      toast("上传失败，请重试", "error");
    }
  };

  const handleDeleteResume = () => {
    deleteResume();
    setResumeName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast("简历已删除", "info");
  };

  const handleStartInterview = async () => {
    const qaItems = loadQALibrary();
    const resume = loadResume();

    // Save interview context for overlay/record windows
    const context = {
      resumeName: resume?.fileName ?? null,
      resumeData: resume?.data ?? null,
      qaCount: qaItems.length,
      qaItems: qaItems,
      position: "面试",
      startedAt: new Date().toISOString(),
    };
    saveInterviewContext(context);
    localStorage.setItem("interview_context_full", JSON.stringify(context));

    // Try to launch Tauri overlay + record windows
    try {
      await startInterviewWindows();
      toast(`面试已启动！简历${resumeName ? `「${resumeName}」` : "未上传"}，问答库 ${qaItems.length} 条`, "success");
    } catch {
      toast("面试窗口启动失败，请检查 Tauri 环境。数据已保存。", "error");
    }
  };

  const handleAnalyzeResume = async () => {
    const resume = loadResume();
    if (!resume) {
      toast("请先上传简历", "error");
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Reconstruct the file from base64
      const byteStr = atob(resume.data);
      const bytes = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) {
        bytes[i] = byteStr.charCodeAt(i);
      }

      const ext = resume.fileName.split(".").pop()?.toLowerCase() ?? "";
      const mimeMap: Record<string, string> = {
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        txt: "text/plain",
      };
      const mimeType = mimeMap[ext] || "application/octet-stream";
      const file = new File([bytes], resume.fileName, { type: mimeType });

      const text = await extractResumeText(file);

      if (!text || text.length < 10) {
        toast("无法提取简历文本，请确保文件包含文字内容", "error");
        setAnalyzing(false);
        return;
      }

      const systemPrompt = `你是一位专业的简历分析专家。请根据以下简历内容，用中文进行简要分析：
1. 候选人核心技能（3-5个关键词）
2. 工作经验亮点
3. 适合的岗位方向
4. 面试建议（2-3条）
请简洁回复，控制在 300 字以内。`;

      const analysis = await callDeepSeek([
        { role: "system", content: systemPrompt },
        { role: "user", content: `简历内容：\n${text.slice(0, 8000)}` },
      ]);

      setAnalysisResult(analysis);
      toast("简历分析完成", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "分析失败";
      toast(msg, "error");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">新的面试</h1>
        <p className="text-sm text-gray-500 mt-1">上传简历和创建问答库，然后点击前往面试开始</p>
      </div>

      {/* Resume Upload Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📄 简历上传</h2>

        {resumeName ? (
          <>
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📎</span>
                <div>
                  <p className="text-sm font-medium text-green-700">已上传简历</p>
                  <p className="text-xs text-green-600">{resumeName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  重新上传
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleDeleteResume}>
                  删除
                </Button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleAnalyzeResume} disabled={analyzing} className="text-primary border-primary">
                {analyzing ? "🤖 AI 分析中..." : "🤖 AI 分析简历"}
              </Button>
              {analysisResult && <p className="text-xs text-green-600">分析完成，结果见下方</p>}
            </div>
            {analysisResult && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs font-medium text-blue-600 mb-2">📊 AI 分析结果：</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysisResult}</p>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">
                你并未上传简历，AI 将无法基于简历回答
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-primary border-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                去上传
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />

        <p className="text-xs text-gray-400 mt-3">
          支持 .pdf / .doc / .docx 格式，最大 10MB
        </p>
      </Card>

      {/* Q&A Library Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📚 自定义问答库</h2>
        <p className="text-sm text-gray-500 mb-4">
          创建和管理自定义面试问答对，AI 将结合问答库生成更精准的回答
        </p>
        <Button
          className="bg-primary hover:bg-primary-600"
          onClick={() => setIsQAModalOpen(true)}
        >
          创建问答库
        </Button>
      </Card>

      {/* Start Interview */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          className="bg-primary hover:bg-primary-600 text-white px-12 py-6 text-base rounded-xl"
          onClick={handleStartInterview}
        >
          前往面试
        </Button>
      </div>

      {/* Q&A Library Modal */}
      <QALibraryModal
        open={isQAModalOpen}
        onClose={() => setIsQAModalOpen(false)}
      />
    </div>
  );
}
