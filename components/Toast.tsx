"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  onUndo?: () => void;
  undoTimeout?: number;
}

export default function Toast({ message, type, onClose, onUndo, undoTimeout = 5000 }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const duration = onUndo ? undoTimeout : 3000;

  useEffect(() => {
    const startTime = Date.now();
    const timer = setTimeout(onClose, duration);

    // Progress bar animation for undo toasts
    if (onUndo) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
      }, 50);
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }

    return () => clearTimeout(timer);
  }, [onClose, onUndo, duration]);

  const handleUndo = () => {
    onUndo?.();
    onClose();
  };

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 rounded-lg shadow-lg transition-all animate-slide-up overflow-hidden ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      } text-white font-medium`}
    >
      <div className="flex items-center gap-3 px-4 py-2">
        <span>{message}</span>
        {onUndo && (
          <button
            onClick={handleUndo}
            className="text-white/90 hover:text-white font-semibold underline underline-offset-2 transition-colors"
          >
            Undo
          </button>
        )}
      </div>
      {onUndo && (
        <div
          className="h-1 bg-white/30 transition-all duration-50"
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
}
