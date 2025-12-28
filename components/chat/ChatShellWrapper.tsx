/**
 * Chat Wrapper - Client component that wraps ChatShell
 * Needed to avoid SSR hydration issues
 */

"use client";

import dynamic from "next/dynamic";

const ChatShell = dynamic(
  () => import("./ChatShell").then(mod => mod.ChatShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 bg-[#060812] p-4 text-[#6E748A] font-mono text-sm rounded-lg border border-[rgba(255,255,255,0.075)]">
        Loading chat interface...
      </div>
    ),
  }
);

export function ChatShellWrapper() {
  return <ChatShell />;
}
