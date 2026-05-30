import { useState, useEffect, useRef } from "react";

interface QaItem {
  question: string;
  answer: string;
  timestamp: string;
}

export default function RecordApp() {
  const [qaList, setQaList] = useState<QaItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem("interview_history");
        if (raw) {
          const history = JSON.parse(raw) as QaItem[];
          setQaList(history);
        }
      } catch { /* ignore */ }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [qaList]);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="shrink-0 px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-200">📋 面试全程记录</h2>
        <p className="text-xs text-gray-500 mt-0.5">一问一答 · 自动追加</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {qaList.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">等待面试开始...</p>
          </div>
        ) : (
          qaList.map((qa, index) => (
            <div key={index} className="space-y-2">
              <div className="bg-gray-800 rounded-lg p-3 border-l-2 border-blue-500">
                <p className="text-xs text-blue-400 font-medium mb-1">
                  Q{index + 1} · 面试官：
                </p>
                <p className="text-sm text-gray-200">{qa.question}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 border-l-2 border-green-500 ml-3">
                <p className="text-xs text-green-400 font-medium mb-1">
                  A{index + 1} · AI回答：
                </p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{qa.answer}</p>
              </div>
              <p className="text-xs text-gray-600 text-right">
                {new Date(qa.timestamp).toLocaleTimeString("zh-CN")}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 px-4 py-2 border-t border-gray-700 text-center">
        <p className="text-xs text-gray-600">
          {qaList.length > 0 ? `共 ${qaList.length} 轮问答` : "空格键开始首轮问答"}
        </p>
      </div>
    </div>
  );
}
