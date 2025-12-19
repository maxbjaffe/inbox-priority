"use client";

import { useState } from "react";

interface DueDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (dueDate: string) => void;
}

export default function DueDateModal({ isOpen, onClose, onSelect }: DueDateModalProps) {
  const [customDate, setCustomDate] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (option: string) => {
    onSelect(option);
    onClose();
  };

  const handleCustomSubmit = () => {
    if (customDate) {
      onSelect(customDate);
      onClose();
    }
  };

  // Get tomorrow's date for the min attribute
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#2a2a3e] rounded-t-2xl p-4 pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-[#4a4a5e] rounded-full mx-auto mb-4" />

        <h2 className="text-lg font-semibold text-[#e4e4e7] mb-4 text-center">
          When is this due?
        </h2>

        {!showCustom ? (
          <div className="space-y-2">
            <button
              onClick={() => handleSelect("today")}
              className="w-full flex items-center gap-3 p-4 bg-[#3a3a4e] hover:bg-[#4a4a5e] rounded-xl text-[#e4e4e7] transition-colors"
            >
              <span className="text-2xl">📅</span>
              <div className="text-left">
                <div className="font-medium">Today</div>
                <div className="text-sm text-[#8b8b96]">
                  {today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </div>
              </div>
            </button>

            <button
              onClick={() => handleSelect("tomorrow")}
              className="w-full flex items-center gap-3 p-4 bg-[#3a3a4e] hover:bg-[#4a4a5e] rounded-xl text-[#e4e4e7] transition-colors"
            >
              <span className="text-2xl">🌅</span>
              <div className="text-left">
                <div className="font-medium">Tomorrow</div>
                <div className="text-sm text-[#8b8b96]">
                  {new Date(today.getTime() + 86400000).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowCustom(true)}
              className="w-full flex items-center gap-3 p-4 bg-[#3a3a4e] hover:bg-[#4a4a5e] rounded-xl text-[#e4e4e7] transition-colors"
            >
              <span className="text-2xl">📆</span>
              <div className="text-left">
                <div className="font-medium">Pick a date</div>
                <div className="text-sm text-[#8b8b96]">Choose a specific date</div>
              </div>
            </button>

            <button
              onClick={() => handleSelect("")}
              className="w-full flex items-center gap-3 p-4 bg-[#3a3a4e] hover:bg-[#4a4a5e] rounded-xl text-[#e4e4e7] transition-colors"
            >
              <span className="text-2xl">⏳</span>
              <div className="text-left">
                <div className="font-medium">No due date</div>
                <div className="text-sm text-[#8b8b96]">Add without a deadline</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              min={todayStr}
              className="w-full p-4 bg-[#3a3a4e] rounded-xl text-[#e4e4e7] border border-[#4a4a5e] focus:border-blue-500 focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowCustom(false)}
                className="flex-1 p-3 bg-[#3a3a4e] hover:bg-[#4a4a5e] rounded-xl text-[#e4e4e7] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCustomSubmit}
                disabled={!customDate}
                className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white transition-colors disabled:opacity-50"
              >
                Set Date
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 p-3 text-[#8b8b96] hover:text-[#e4e4e7] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
