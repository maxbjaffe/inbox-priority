"use client";

import { useState, useCallback, useEffect } from "react";
import type { Email } from "@/types";
import type { DateRange } from "@/lib/gmail";
import EmailCard from "./EmailCard";
import Header from "./Header";
import Toast from "./Toast";
import { emailToTodoistTask } from "@/lib/todoist";

export default function EmailList() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("today");

  const fetchEmails = useCallback(async (range: DateRange = dateRange) => {
    setIsLoading(true);
    setError(null);
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

    // Wait for animation then remove
    setTimeout(() => {
      setEmails((prev) => prev.filter((e) => e.id !== id));
      setToast({ message: "Marked as read", type: "success" });
    }, 300);
  };

  const handleArchive = async (id: string) => {
    const res = await fetch(`/api/emails/${id}/archive`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to archive");

    // Wait for animation then remove
    setTimeout(() => {
      setEmails((prev) => prev.filter((e) => e.id !== id));
      setToast({ message: "Archived", type: "success" });
    }, 300);
  };

  const handleAddToTodoist = async (email: Email) => {
    const task = emailToTodoistTask(email);
    const res = await fetch("/api/todoist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });

    if (!res.ok) throw new Error("Failed to create task");
    setToast({ message: "Added to Todoist!", type: "success" });
  };

  const urgentCount = emails.filter((e) => e.analysis?.is_urgent).length;

  return (
    <div className="min-h-screen bg-[#1e1e2e]">
      <Header
        urgentCount={urgentCount}
        totalCount={emails.length}
        onRefresh={() => fetchEmails(dateRange)}
        isLoading={isLoading}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
      />

      <main className="p-4 pb-20">
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
            />
          ))}
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
