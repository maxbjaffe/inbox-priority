"use client";

interface BulkActionBarProps {
  selectedCount: number;
  onMarkRead: () => void;
  onArchive: () => void;
  onTask: () => void;
  isProcessing: boolean;
}

export default function BulkActionBar({
  selectedCount,
  onMarkRead,
  onArchive,
  onTask,
  isProcessing,
}: BulkActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#2a2a3e] border-t border-[#3a3a4e] p-4 pb-8 animate-slide-up">
      <div className="max-w-lg mx-auto">
        <p className="text-center text-[#e4e4e7] text-sm mb-3">
          {selectedCount} email{selectedCount !== 1 ? "s" : ""} selected
        </p>

        <div className="flex gap-2">
          <button
            onClick={onMarkRead}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 bg-[#3a3a4e] hover:bg-[#4a4a5e] text-[#e4e4e7] px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Read
          </button>

          <button
            onClick={onArchive}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 bg-[#3a3a4e] hover:bg-[#4a4a5e] text-[#e4e4e7] px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Archive
          </button>

          <button
            onClick={onTask}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Task
          </button>
        </div>

        {isProcessing && (
          <div className="flex justify-center mt-3">
            <div className="w-5 h-5 border-2 border-[#e4e4e7] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
