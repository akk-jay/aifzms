import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { loadRecords } from "@/lib/commands";

interface QaItem {
  question: string;
  answer: string;
  timestamp: string;
}

interface Record {
  id: string;
  date: string;
  position: string;
  qaList: QaItem[];
}

export default function Records() {
  const [records, setRecords] = useState<Record[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords()
      .then((json) => {
        if (json) {
          const data = JSON.parse(json);
          setRecords(data.records || []);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">面试记录</h1>
        <p className="text-sm text-gray-500 mt-1">查看历史面试问答记录</p>
      </div>

      {records.length === 0 ? (
        <Card className="p-12 text-center text-gray-400">
          <p className="text-lg mb-2">📭 暂无面试记录</p>
          <p className="text-sm">完成一次面试后，记录将显示在这里</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id} className="p-5">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
              >
                <div>
                  <h3 className="font-medium text-gray-800">
                    {record.position} 面试 - {record.date}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {record.qaList.length} 轮问答
                  </p>
                </div>
                <span className="text-gray-400 text-lg">
                  {expandedId === record.id ? "▾" : "▸"}
                </span>
              </div>
              {expandedId === record.id && (
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                  {record.qaList.map((qa, i) => (
                    <div key={i} className="pl-4 border-l-2 border-primary-100">
                      <p className="text-sm font-medium text-blue-600">
                        Q{i + 1} · 面试官：{qa.question}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        A{i + 1} · AI回答：{qa.answer}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{qa.timestamp}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
