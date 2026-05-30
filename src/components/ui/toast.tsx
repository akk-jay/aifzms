import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface ToastData {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let addToastFn: ((message: string, type: "success" | "error" | "info") => void) | null = null;

export function toast(message: string, type: "success" | "error" | "info" = "info") {
  addToastFn?.(message, type);
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" | "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg animate-in slide-in-from-top-2 transition-all",
            t.type === "success" && "bg-green-500 text-white",
            t.type === "error" && "bg-red-500 text-white",
            t.type === "info" && "bg-blue-500 text-white"
          )}
        >
          {t.type === "success" && "✅ "}
          {t.type === "error" && "❌ "}
          {t.type === "info" && "ℹ️ "}
          {t.message}
        </div>
      ))}
    </div>
  );
}
