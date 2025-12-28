/**
 * ChatMessage Renderer
 * Pure render component - no side effects
 * Renders a single message according to role and state
 * Enhanced with better visual feedback and accessibility
 */

import type { ChatMessage } from "@/lib/chat/types";

interface ChatMessageProps {
  message: ChatMessage;
  queuePosition?: number;
}

export function ChatMessage({ message, queuePosition }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="text-sm text-[#E2E6F0] font-mono p-3 bg-[#0A0E1B]/50 rounded-lg mb-2 border-l-4 border-[#6EDBD6] hover:bg-[#0A0E1B]/70 transition-colors group">
        <span className="text-[#6EDBD6] font-bold">&gt;</span>
        <span className="ml-1 group-hover:text-[#9BFFB0] transition-colors">
          {message.content}
        </span>
      </div>
    );
  }

  if (message.role === "system") {
    const isExecuting = message.state === "executing";
    const indicator = isExecuting ? "●" : "○";
    const statusText = isExecuting
      ? "executing"
      : `queued (#${queuePosition || 0})`;

    const statusClass = isExecuting ? "text-[#D6A65A]" : "text-[#6EDBD6]";

    return (
      <div className="text-sm text-[#A1A8BC] font-mono p-3 bg-[#0A0E1B]/30 rounded-lg mb-2 border-l-4 border-[#D6A65A] hover:bg-[#0A0E1B]/50 transition-colors">
        <span className={`${statusClass} font-bold animate-pulse-soft`}>
          {indicator}
        </span>
        <span className="ml-1">{statusText}</span>
        {message.meta && Object.keys(message.meta).length > 0 && (
          <span className="text-[#6E748A] ml-3 opacity-75">
            [
            {Object.entries(message.meta)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")}
            ]
          </span>
        )}
      </div>
    );
  }

  if (message.role === "result") {
    const isSuccess = message.status === "success";
    const icon = isSuccess ? "✓" : "✗";
    const iconColor = isSuccess ? "text-[#9BFFB0]" : "text-[#C94A5A]";
    const bgColor = isSuccess
      ? "bg-[#0A0E1B]/50 border-[#9BFFB0]/30"
      : "bg-[#0A0E1B]/50 border-[#C94A5A]/30";
    const borderColor = isSuccess
      ? "border-[#9BFFB0]/60"
      : "border-[#C94A5A]/60";

    return (
      <div
        className={`text-sm font-mono ${iconColor} p-3 rounded-lg mb-2 border-l-4 ${bgColor} ${borderColor} hover:bg-[#0A0E1B]/70 transition-colors group`}
      >
        <span className="font-bold mr-2 group-hover:scale-110 inline-block transition-transform origin-left">
          {icon}
        </span>
        <span className="text-[#E2E6F0]">{message.output}</span>
      </div>
    );
  }

  // Unreachable but TypeScript requires
  return null;
}
