"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Email } from "@/types";
import type { DateRange } from "@/lib/gmail";
import EmailCard from "./EmailCard";
import Header from "./Header";
import Toast from "./Toast";
import BulkActionBar from "./BulkActionBar";
import DueDateModal from "./DueDateModal";
import { emailToTodoistTask } from "@/lib/todoist";

export default function EmailList() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    onUndo?: () => void;
  } | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showBulkDueDateModal, setShowBulkDueDateModal] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Store removed emails for undo
  const removedEmailsRef = useRef<Map<string, { email: Email; index: number }>>(new Map());

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 80;

  const fetchEmails = useCallback(async (range: DateRange = dateRange) => {
    setIsLoading(true);
    setError(null);
    setSelectedIds(new Set());
    setIsSelectMode(false);
    try {
      const res = await fetch(`/api/emails?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch emails");
      const data = await res.json();
      setEmails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchEmails(dateRange);
  }, [dateRange, fetchEmails]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const handleMarkRead = async (id: string) => {
    const res = await fetch(`/api/emails/${id}/read`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to mark as read");

    setTimeout(() => {
      // Store email for potential undo
      const emailIndex = emails.findIndex((e) => e.id === id);
      const email = emails[emailIndex];
      if (email) {
        removedEmailsRef.current.set(id, { email, index: emailIndex });
      }

      setEmails((prev) => prev.filter((e) => e.id !== id));
      setToast({
        message: "Marked as read",
        type: "success",
        onUndo: () => handleUndoMarkRead(id),
      });
    }, 300);
  };

  const handleUndoMarkRead = async (id: string) => {
    const removed = removedEmailsRef.current.get(id);
    if (!removed) return;

    // Mark as unread in Gmail
    try {
      await fetch(`/api/emails/${id}/unread`, { method: "POST" });

      // Restore email to list at original position
      setEmails((prev) => {
        const newEmails = [...prev];
        const insertIndex = Math.min(removed.index, newEmails.length);
        newEmails.splice(insertIndex, 0, removed.email);
        return newEmails;
      });

      removedEmailsRef.current.delete(id);
      setToast({ message: "Email restored", type: "success" });
    } catch {
      setToast({ message: "Failed to restore email", type: "error" });
    }
  };

  const handleArchive = async (id: string) => {
    const res = await fetch(`/api/emails/${id}/archive`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to archive");

    setTimeout(() => {
      // Store email for potential undo
      const emailIndex = emails.findIndex((e) => e.id === id);
      const email = emails[emailIndex];
      if (email) {
        removedEmailsRef.current.set(id, { email, index: emailIndex });
      }

      setEmails((prev) => prev.filter((e) => e.id !== id));
      setToast({
        message: "Archived",
        type: "success",
        onUndo: () => handleUndoArchive(id),
      });
    }, 300);
  };

  const handleUndoArchive = async (id: string) => {
    const removed = removedEmailsRef.current.get(id);
    if (!removed) return;

    // Unarchive (move back to inbox)
    try {
      await fetch(`/api/emails/${id}/unarchive`, { method: "POST" });

      // Restore email to list at original position
      setEmails((prev) => {
        const newEmails = [...prev];
        const insertIndex = Math.min(removed.index, newEmails.length);
        newEmails.splice(insertIndex, 0, removed.email);
        return newEmails;
      });

      removedEmailsRef.current.delete(id);
      setToast({ message: "Email restored to inbox", type: "success" });
    } catch {
      setToast({ message: "Failed to restore email", type: "error" });
    }
  };

  const handleAddToTodoist = async (email: Email, dueDate?: string) => {
    const task = emailToTodoistTask(email, dueDate);
    const res = await fetch("/api/todoist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });

    if (!res.ok) throw new Error("Failed to create task");
    setToast({ message: "Added to Todoist!", type: "success" });
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleLongPress = (id: string) => {
    if (!isSelectMode) {
      setIsSelectMode(true);
      setSelectedIds(new Set([id]));
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === emails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(emails.map((e) => e.id)));
    }
  };

  const handleCancelSelect = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  // Bulk actions
  const handleBulkMarkRead = async () => {
    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);

    try {
      await Promise.all(
        ids.map((id) => fetch(`/api/emails/${id}/read`, { method: "POST" }))
      );

      setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      setToast({ message: `${ids.length} emails marked as read`, type: "success" });
      handleCancelSelect();
    } catch {
      setToast({ message: "Failed to mark emails as read", type: "error" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkArchive = async () => {
    setIsBulkProcessing(true);
    const ids = Array.from(selectedIds);

    try {
      await Promise.all(
        ids.map((id) => fetch(`/api/emails/${id}/archive`, { method: "POST" }))
      );

      setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      setToast({ message: `${ids.length} emails archived`, type: "success" });
      handleCancelSelect();
    } catch {
      setToast({ message: "Failed to archive emails", type: "error" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkTaskClick = () => {
    setShowBulkDueDateModal(true);
  };

  const handleBulkDueDateSelect = async (dueDate: string) => {
    setIsBulkProcessing(true);
    const selectedEmails = emails.filter((e) => selectedIds.has(e.id));

    try {
      await Promise.all(
        selectedEmails.map((email) => {
          const task = emailToTodoistTask(email, dueDate || undefined);
          return fetch("/api/todoist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task),
          });
        })
      );

      setToast({ message: `${selectedEmails.length} tasks created`, type: "success" });
      handleCancelSelect();
    } catch {
      setToast({ message: "Failed to create tasks", type: "error" });
    } finally {
      setIsBulkProcessing(false);
      setShowBulkDueDateModal(false);
    }
  };

  const urgentCount = emails.filter((e) => e.analysis?.is_urgent).length;

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (mainRef.current && mainRef.current.scrollTop === 0 && !isLoading && !isRefreshing) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isLoading, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - touchStartY.current);

    // Apply resistance - diminishing returns as you pull further
    const resistedDistance = Math.min(distance * 0.5, 120);
    setPullDistance(resistedDistance);
  }, [isPulling]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      await fetchEmails(dateRange);
      setIsRefreshing(false);
    }

    setPullDistance(0);
    setIsPulling(false);
  }, [isPulling, pullDistance, fetchEmails, dateRange]);

  return (
    <div className="min-h-screen bg-[#1e1e2e]">
      <Header
        urgentCount={urgentCount}
        totalCount={emails.length}
        onRefresh={() => fetchEmails(dateRange)}
        isLoading={isLoading}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        isSelectMode={isSelectMode}
        selectedCount={selectedIds.size}
        onSelectAll={handleSelectAll}
        onCancelSelect={handleCancelSelect}
        allSelected={selectedIds.size === emails.length && emails.length > 0}
      />

      <main
        ref={mainRef}
        className="p-4 pb-32 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 120px)" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        <div
          className="flex justify-center items-center overflow-hidden transition-all duration-200"
          style={{
            height: pullDistance > 0 ? pullDistance : 0,
            opacity: pullDistance / PULL_THRESHOLD,
          }}
        >
          <div className={`flex flex-col items-center ${isRefreshing ? "animate-pulse" : ""}`}>
            <svg
              className={`w-6 h-6 text-[#e4e4e7] transition-transform ${
                pullDistance >= PULL_THRESHOLD ? "rotate-180" : ""
              } ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isRefreshing ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              )}
            </svg>
            <span className="text-xs text-[#8b8b96] mt-1">
              {isRefreshing ? "Refreshing..." : pullDistance >= PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
            </span>
          </div>
        </div>

        {isLoading && emails.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#e4e4e7] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#8b8b96]">Analyzing your emails...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-xl p-4 text-center">
            <p className="text-red-400 mb-3">{error}</p>
            <button
              onClick={() => fetchEmails(dateRange)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && emails.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-[#e4e4e7] text-lg font-medium">No unread emails!</p>
            <p className="text-[#8b8b96] text-sm mt-1">You're all caught up for this period</p>
          </div>
        )}

        <div className="space-y-3">
          {emails.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              onMarkRead={handleMarkRead}
              onArchive={handleArchive}
              onAddToTodoist={handleAddToTodoist}
              isSelectMode={isSelectMode}
              isSelected={selectedIds.has(email.id)}
              onToggleSelect={handleToggleSelect}
              onLongPress={handleLongPress}
            />
          ))}
        </div>
      </main>

      {isSelectMode && selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onMarkRead={handleBulkMarkRead}
          onArchive={handleBulkArchive}
          onTask={handleBulkTaskClick}
          isProcessing={isBulkProcessing}
        />
      )}

      <DueDateModal
        isOpen={showBulkDueDateModal}
        onClose={() => setShowBulkDueDateModal(false)}
        onSelect={handleBulkDueDateSelect}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          onUndo={toast.onUndo}
        />
      )}
    </div>
  );
}
