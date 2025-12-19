"use client";

import { signOut } from "next-auth/react";
import type { DateRange } from "@/lib/gmail";

interface HeaderProps {
  urgentCount: number;
  totalCount: number;
  onRefresh: () => void;
  isLoading: boolean;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "60d", label: "Last 60 days" },
  { value: "90d", label: "Last 90 days" },
];

export default function Header({
  urgentCount,
  totalCount,
  onRefresh,
  isLoading,
  dateRange,
  onDateRangeChange
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[#1e1e2e] border-b border-[#3a3a4e] px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#e4e4e7]">InboxPriority</h1>
          {urgentCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {urgentCount}
            </span>
          )}
          {totalCount > 0 && (
            <span className="text-[#8b8b96] text-xs">
              {totalCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[#2a2a3e] hover:bg-[#3a3a4e] transition-colors disabled:opacity-50"
            aria-label="Refresh emails"
          >
            <svg
              className={`w-5 h-5 text-[#e4e4e7] ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg bg-[#2a2a3e] hover:bg-[#3a3a4e] transition-colors"
            aria-label="Sign out"
          >
            <svg
              className="w-5 h-5 text-[#e4e4e7]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {dateRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onDateRangeChange(option.value)}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              dateRange === option.value
                ? "bg-blue-600 text-white"
                : "bg-[#2a2a3e] text-[#e4e4e7] hover:bg-[#3a3a4e]"
            } disabled:opacity-50`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </header>
  );
}
