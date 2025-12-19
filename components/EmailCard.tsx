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

const SWIPE_THRESHOLD = 100;

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

  // Expansion state
  const [isExpanded, setIsExpanded] = useState(false);
  const [emailBody, setEmailBody] = useState<{ text: string; html: string } | null>(null);
  const [isLoadingBody, setIsLoadingBody] = useState(false);

  // Swipe state
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const urgencyScore = email.analysis?.urgency_score || 0;

  // Combined touch handlers for both long-press and swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isSelectMode || isProcessing) return;

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);

    // Start long-press timer
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setIsSwiping(false);
      setSwipeX(0);
      onLongPress?.(email.id);
    }, 500);
  }, [isSelectMode, isProcessing, onLongPress, email.id]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping || isSelectMode) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
        // Cancel long-press if swiping
        if (isHorizontalSwipe.current && longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
    }

    // Only handle horizontal swipes
    if (isHorizontalSwipe.current) {
      // Apply resistance at edges
      const resistedDelta = deltaX * 0.6;
      setSwipeX(resistedDelta);
    }
  }, [isSwiping, isSelectMode]);

  const handleTouchEnd = useCallback(async () => {
    // Clear long-press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isSwiping) return;
    setIsSwiping(false);

    // Check if swipe exceeded threshold
    if (Math.abs(swipeX) >= SWIPE_THRESHOLD) {
      if (swipeX > 0) {
        // Swipe right -> Mark as read
        setSwipeX(300); // Animate off screen
        setIsProcessing(true);
        try {
          await onMarkRead(email.id);
          setIsRemoving(true);
        } catch {
          setSwipeX(0);
          setIsProcessing(false);
        }
      } else {
        // Swipe left -> Archive
        setSwipeX(-300); // Animate off screen
        setIsProcessing(true);
        try {
          await onArchive(email.id);
          setIsRemoving(true);
        } catch {
          setSwipeX(0);
          setIsProcessing(false);
        }
      }
    } else {
      // Snap back
      setSwipeX(0);
    }
  }, [isSwiping, swipeX, onMarkRead, onArchive, email.id]);

  const handleCardClick = async () => {
    if (isSelectMode) {
      onToggleSelect?.(email.id);
      return;
    }

    // Toggle expansion when not in select mode and not swiping
    if (!isHorizontalSwipe.current && !isLongPress.current) {
      if (!isExpanded && !emailBody) {
        // Fetch body on first expansion
        setIsLoadingBody(true);
        try {
          const res = await fetch(`/api/emails/${email.id}/body`);
          if (res.ok) {
            const body = await res.json();
            setEmailBody(body);
          }
        } catch {
          // Silently fail, will show snippet instead
        } finally {
          setIsLoadingBody(false);
        }
      }
      setIsExpanded(!isExpanded);
    }
  };

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
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
      <div className={`relative overflow-hidden rounded-xl ${isRemoving ? "opacity-0 h-0 mb-0 transition-all duration-300" : ""}`}>
        {/* Swipe action backgrounds */}
        {!isSelectMode && (
          <>
            {/* Right swipe - Mark as read (green) */}
            <div
              className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 bg-green-600 rounded-xl transition-opacity"
              style={{
                width: "100%",
                opacity: swipeX > 20 ? Math.min(swipeX / SWIPE_THRESHOLD, 1) : 0,
              }}
            >
              <div className="flex items-center gap-2 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Mark Read</span>
              </div>
            </div>

            {/* Left swipe - Archive (orange) */}
            <div
              className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-orange-600 rounded-xl transition-opacity"
              style={{
                width: "100%",
                opacity: swipeX < -20 ? Math.min(Math.abs(swipeX) / SWIPE_THRESHOLD, 1) : 0,
              }}
            >
              <div className="flex items-center gap-2 text-white">
                <span className="font-medium">Archive</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
          </>
        )}

        {/* Card content */}
        <div
          className={`bg-[#2a2a3e] rounded-xl p-4 shadow-lg relative ${
            isSelected ? "ring-2 ring-blue-500" : ""
          }`}
          style={{
            transform: `translateX(${swipeX}px)`,
            transition: isSwiping ? "none" : "transform 0.3s ease-out",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
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

            {/* Expanded email body */}
            {isExpanded && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#8b8b96]">Email Content</span>
                  <button
                    onClick={handleCollapseClick}
                    className="text-[#8b8b96] hover:text-[#e4e4e7] p-1 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>
                {isLoadingBody ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-[#e4e4e7] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="bg-[#1e1e2e] rounded-lg p-3 max-h-64 overflow-y-auto">
                    {emailBody?.html ? (
                      <div
                        className="text-sm text-[#e4e4e7] prose prose-invert prose-sm max-w-none [&_a]:text-blue-400 [&_img]:max-w-full"
                        dangerouslySetInnerHTML={{
                          __html: emailBody.html
                            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                        }}
                      />
                    ) : emailBody?.text ? (
                      <pre className="text-sm text-[#e4e4e7] whitespace-pre-wrap font-sans">
                        {emailBody.text}
                      </pre>
                    ) : (
                      <p className="text-sm text-[#8b8b96]">{email.snippet}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tap to expand hint - only when collapsed */}
            {!isExpanded && !isSelectMode && (
              <div className="flex items-center gap-1 text-xs text-[#6b6b76] mb-3">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>Tap to expand</span>
              </div>
            )}

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
      </div>

      <DueDateModal
        isOpen={showDueDateModal}
        onClose={() => setShowDueDateModal(false)}
        onSelect={handleDueDateSelect}
      />
    </>
  );
}
