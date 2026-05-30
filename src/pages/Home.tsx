import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { loadResume, saveResume, deleteResume } from "@/lib/storage";
import QALibraryModal from "@/components/QALibraryModal";

export default function Home() {
  const [resumeName, setResumeName] = useState<string | null>(() => {
    const r = loadResume();
    return r?.fileName ?? null;
  });
  const [isQAModalOpen, setIsQAModalOpen] = useState(false);
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

  const handleStartInterview = () => {
    toast("面试窗口功能将在后续版本中开放", "info");
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
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📎</span>
              <div>
                <p className="text-sm font-medium text-green-700">已上传简历</p>
                <p className="text-xs text-green-600">{resumeName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                重新上传
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={handleDeleteResume}
              >
                删除
              </Button>
            </div>
          </div>
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
