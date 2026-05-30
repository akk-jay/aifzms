import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { loadQALibrary, saveQALibrary, type QAItem } from "@/lib/storage";

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
