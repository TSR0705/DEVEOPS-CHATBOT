import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType } from "@/lib/chat/types";
import { ChatMessage } from "./ChatMessage";

interface ChatStreamProps {
  messages: ChatMessageType[];
}

export function ChatStream({ messages }: ChatStreamProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#060812] p-4 font-mono text-sm scroll-smooth">
      <div className="space-y-2">
        {messages.length === 0 && (
          <div className="text-[#6E748A] p-8 text-center rounded-lg border border-[rgba(255,255,255,0.035)] animate-fade-in">
            <div className="mb-2 text-xl">⌘</div>
            <div className="font-medium">Ready for commands</div>
            <div className="text-xs mt-2 opacity-75">
              Type <span className="text-[#9BFFB0]">help</span> to see available
              commands
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="animate-fade-in duration-300">
            <ChatMessage message={msg} />
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
