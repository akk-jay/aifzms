import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { loadQALibrary, saveQALibrary, type QAItem } from "@/lib/storage";
import { extractResumeText } from "@/lib/resumeParser";
import { callDeepSeek } from "@/lib/deepseekService";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function QALibraryModal({ open, onClose }: Props) {
  const [items, setItems] = useState<QAItem[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setItems(loadQALibrary());
    }
  }, [open]);

  const handleAdd = () => {
    if (!question.trim() || !answer.trim()) {
      toast("问题和答案不能为空", "error");
      return;
    }

    setLoading(true);
    const newItems: QAItem[] = editId
      ? items.map((item) =>
          item.id === editId ? { ...item, question: question.trim(), answer: answer.trim() } : item
        )
      : [...items, { id: Date.now().toString(), question: question.trim(), answer: answer.trim() }];

    saveQALibrary(newItems);
    setItems(newItems);
    setQuestion("");
    setAnswer("");
    setEditId(null);
    setLoading(false);
    toast(editId ? "问答已更新" : "已添加到问答库", "success");
  };

  const handleEdit = (item: QAItem) => {
    setQuestion(item.question);
    setAnswer(item.answer);
    setEditId(item.id);
  };

  const handleDelete = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    saveQALibrary(newItems);
    setItems(newItems);
    if (editId === id) {
      setQuestion("");
      setAnswer("");
      setEditId(null);
    }
    toast("已删除", "info");
  };

  const handleCancel = () => {
    setQuestion("");
    setAnswer("");
    setEditId(null);
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx", "txt"].includes(ext ?? "")) {
      toast("仅支持 pdf/doc/docx/txt 格式", "error");
      return;
    }
    setScanning(true);
    setScanResult(null);
    try {
      const text = await extractResumeText(file);
      if (!text || text.length < 10) {
        toast("无法提取文本内容", "error");
        setScanning(false);
        return;
      }
      const prompt = `请从以下资料中提取所有面试问答对。对于每个问答对，用 JSON 数组格式返回：\n[{"question": "问题", "answer": "回答"}, ...]\n\n如果资料不是问答格式，而是背景资料，请根据资料内容生成 3-5 个可能的面试问题及其参考答案。\n\n只返回 JSON 数组，不要其他内容。\n\n资料内容：\n${text.slice(0, 6000)}`;

      const reply = await callDeepSeek([
        { role: "user", content: prompt },
      ]);

      // Parse JSON from reply
      const jsonMatch = reply.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        setScanResult("AI 未能识别出有效的问答对，请手动添加。原文:\n" + reply);
        toast("AI 扫描完成，但未能解析，请手动添加", "info");
        setScanning(false);
        return;
      }
      try {
        const parsed: { question: string; answer: string }[] = JSON.parse(jsonMatch[0]);
        const newItems = parsed.map((qa) => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          question: qa.question,
          answer: qa.answer,
        }));
        const updated = [...items, ...newItems];
        saveQALibrary(updated);
        setItems(updated);
        toast(`AI 扫描完成，新增 ${newItems.length} 条问答`, "success");
      } catch {
        setScanResult("解析结果失败，请手动添加。AI 回复:\n" + reply);
        toast("AI 返回格式异常，请手动添加", "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "扫描失败";
      toast(msg, "error");
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">📚 自定义问答库</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* File Upload + AI Scan */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-2">
            <h3 className="text-sm font-medium text-blue-700">🤖 AI 智能导入</h3>
            <p className="text-xs text-blue-600">上传 PDF/DOCX 文件，AI 自动扫描提取问答对</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-primary border-primary bg-white"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
              >
                {scanning ? "🤖 AI 扫描中..." : "📁 上传文件扫描"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileScan}
                className="hidden"
              />
            </div>
            {scanResult && (
              <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                {scanResult}
              </div>
            )}
          </div>

          {/* Add/Edit Form */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700">
              {editId ? "编辑问答" : "添加新问答"}
            </h3>
            <div className="space-y-2">
              <Input
                placeholder="输入面试问题"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <textarea
                placeholder="输入 AI 参考回答"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={loading} size="sm">
                {loading ? "保存中..." : editId ? "更新" : "添加"}
              </Button>
              {editId && (
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  取消编辑
                </Button>
              )}
            </div>
          </div>

          {/* List */}
          {items.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              还没有添加问答对，在上方添加第一个
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">共 {items.length} 条问答</p>
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <p className="text-sm font-medium text-blue-600 mb-1">
                    Q: {item.question}
                  </p>
                  <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                    A: {item.answer}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleEdit(item)}
                    >
                      ✏️ 编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(item.id)}
                    >
                      🗑️ 删除
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 shrink-0 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
