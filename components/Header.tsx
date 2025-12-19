"use client";

import { signOut } from "next-auth/react";

interface HeaderProps {
  urgentCount: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function Header({ urgentCount, onRefresh, isLoading }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[#1e1e2e] border-b border-[#3a3a4e] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#e4e4e7]">InboxPriority</h1>
          {urgentCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {urgentCount}
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
    </header>
  );
}
