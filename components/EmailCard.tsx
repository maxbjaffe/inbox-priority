"use client";

import { useState, useRef, useCallback } from "react";
import type { Email } from "@/types";
import DueDateModal from "./DueDateModal";

interface EmailCardProps {
  email: Email;
  onMarkRead: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onAddToTodoist: (email: Email, dueDate?: string) => Promise<void>;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function EmailCard({
  email,
  onMarkRead,
  onArchive,
  onAddToTodoist,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onLongPress,
}: EmailCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todoAdded, setTodoAdded] = useState(false);
  const [showDueDateModal, setShowDueDateModal] = useState(false);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const urgencyScore = email.analysis?.urgency_score || 0;

  // Long press handlers
  const handleTouchStart = useCallback(() => {
    if (isSelectMode) return;
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress?.(email.id);
    }, 500);
  }, [isSelectMode, onLongPress, email.id]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleCardClick = () => {
    if (isSelectMode) {
      onToggleSelect?.(email.id);
    }
  };

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      await onMarkRead(email.id);
      setIsRemoving(true);
    } catch {
      setIsProcessing(false);
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      await onArchive(email.id);
      setIsRemoving(true);
    } catch {
      setIsProcessing(false);
    }
  };

  const handleTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!todoAdded && !isProcessing) {
      setShowDueDateModal(true);
    }
  };

  const handleDueDateSelect = async (dueDate: string) => {
    setIsProcessing(true);
    try {
      await onAddToTodoist(email, dueDate || undefined);
      setTodoAdded(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const openInGmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://mail.google.com/mail/u/0/#inbox/${email.id}`, "_blank");
  };

  return (
    <>
      <div
        className={`bg-[#2a2a3e] rounded-xl p-4 shadow-lg transition-all duration-300 ${
          isRemoving ? "opacity-0 -translate-x-full" : ""
        } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-3">
          {/* Selection Checkbox or Urgency Indicator */}
          <div className="flex-shrink-0 pt-1">
            {isSelectMode ? (
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-blue-500 border-blue-500"
                    : "border-[#4a4a5e] bg-transparent"
                }`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            ) : (
              <>
                {urgencyScore >= 5 && (
                  <span className="w-3 h-3 bg-red-500 rounded-full block animate-pulse" />
                )}
                {urgencyScore === 4 && (
                  <span className="w-3 h-3 bg-orange-500 rounded-full block" />
                )}
                {urgencyScore < 4 && (
                  <span className="w-3 h-3 bg-[#3a3a4e] rounded-full block" />
                )}
              </>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-[#e4e4e7] truncate">
                {email.fromName}
              </span>
              <span className="text-xs text-[#8b8b96] flex-shrink-0">
                {timeAgo(email.date)}
              </span>
            </div>

            <h3 className="text-[#e4e4e7] font-semibold mb-1 line-clamp-2">
              {email.subject}
            </h3>

            {email.analysis?.action_item && (
              <p className="text-sm bg-[#3a3a4e] text-[#a5f3fc] px-2 py-1 rounded mb-2 line-clamp-2">
                {email.analysis.action_item}
              </p>
            )}

            <p className="text-xs text-[#8b8b96] truncate mb-3">
              {email.from}
            </p>

            {/* Actions - hidden in select mode */}
            {!isSelectMode && (
            <div className="flex gap-2">
              <button
                onClick={handleMarkRead}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-1 bg-[#3a3a4e] hover:bg-[#4a4a5e] text-[#e4e4e7] px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                title="Mark as read"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Read
              </button>

              <button
                onClick={handleArchive}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-1 bg-[#3a3a4e] hover:bg-[#4a4a5e] text-[#e4e4e7] px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                title="Archive"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive
              </button>

              <button
                onClick={handleTaskClick}
                disabled={isProcessing || todoAdded}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                  todoAdded
                    ? "bg-green-600 text-white"
                    : "bg-[#3a3a4e] hover:bg-[#4a4a5e] text-[#e4e4e7]"
                }`}
                title="Add to Todoist"
              >
                {todoAdded ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Added
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Task
                  </>
                )}
              </button>

              <button
                onClick={openInGmail}
                className="flex items-center justify-center bg-[#3a3a4e] hover:bg-[#4a4a5e] text-[#e4e4e7] px-3 py-2 rounded-lg text-sm transition-colors"
                title="Open in Gmail"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      <DueDateModal
        isOpen={showDueDateModal}
        onClose={() => setShowDueDateModal(false)}
        onSelect={handleDueDateSelect}
      />
    </>
  );
}
