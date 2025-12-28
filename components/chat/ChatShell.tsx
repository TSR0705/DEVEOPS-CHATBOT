/**
 * ChatShell - Client-only chat control plane
 * CRITICAL: "use client" must be present
 * Wires input → queue → execution → result
 * NO direct Kubernetes logic here
 * NO server components inside
 * Enhanced with better error handling and UX
 */

"use client";

import { useReducer, useState, useCallback } from "react";
import { chatReducer } from "@/lib/chat/reducer";
import { ChatContextType } from "@/lib/chat/types";
import { ChatStream } from "./ChatStream";
import { CommandInput } from "./CommandInput";

const initialState: ChatContextType = {
  messages: [],
  state: "idle",
  queueLength: 0,
  currentCommandId: null,
};

export function ChatShell() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number>(0);

  const handleCommandSubmit = useCallback(async (command: string) => {
    // TODO: Wire to backend when ready
    // For now, implement client-side state machine

    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = Date.now();

    // 1. Add user message
    dispatch({
      type: "ADD_USER_MESSAGE",
      payload: { id: commandId, content: command, ts: now },
    });

    // 2. Queue system message
    dispatch({
      type: "SET_QUEUED",
      payload: { id: `${commandId}-system`, meta: { command }, ts: now },
    });

    setIsSubmitting(true);
    const startTime = Date.now();

    // 3. Simulate execution pipeline
    // TODO: Replace with real backend call
    try {
      // Wait a tick to ensure queued is rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // 4. Mark as executing
      dispatch({
        type: "SET_EXECUTING",
        payload: { id: `${commandId}-system`, ts: Date.now() },
      });

      // TODO: Make actual API call here
      // const response = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ command }) })

      // For now, simulate success with random delay
      const delay = Math.random() * 1000 + 300;
      await new Promise(resolve => setTimeout(resolve, delay));

      const elapsed = Date.now() - startTime;
      setExecutionTime(elapsed);

      dispatch({
        type: "SET_RESULT",
        payload: {
          id: `${commandId}-system`,
          status: "success",
          output: `✓ Executed: ${command} (${elapsed}ms)`,
          ts: Date.now(),
        },
      });
    } catch (error) {
      const elapsed = Date.now() - startTime;
      setExecutionTime(elapsed);

      dispatch({
        type: "SET_RESULT",
        payload: {
          id: `${commandId}-system`,
          status: "error",
          output: `✗ Error: ${error instanceof Error ? error.message : "Unknown error"} (${elapsed}ms)`,
          ts: Date.now(),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: "RESET_CHAT" });
    setExecutionTime(0);
  }, []);

  // Count executing, queued, and completed commands
  const completedCount = state.messages.filter(m => m.role === "result").length;
  const statusIndicator =
    state.state === "executing" ? "●" : state.queueLength > 0 ? "◐" : "○";
  const statusColor =
    state.state === "executing"
      ? "text-[#D6A65A]"
      : state.queueLength > 0
        ? "text-[#6EDBD6]"
        : "text-[#9BFFB0]";

  return (
    <div className="flex flex-col h-full bg-[#060812] border border-[rgba(255,255,255,0.075)] rounded-lg overflow-hidden shadow-lg hover:border-[rgba(255,255,255,0.15)] transition-colors">
      {/* Header */}
      <div className="bg-[#0A0E1B] border-b border-[rgba(255,255,255,0.075)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`${statusColor} text-lg animate-pulse-soft`}>
              {statusIndicator}
            </span>
            <span className="text-[#6E748A]">STATUS:</span>
            <span className={`${statusColor} font-bold`}>{state.state}</span>
          </div>

          <div className="h-4 w-px bg-[rgba(255,255,255,0.1)]"></div>

          <div className="text-xs font-mono text-[#A1A8BC]">
            <span className="text-[#6E748A]">QUEUE:</span>{" "}
            <span className="text-[#E2E6F0] font-bold">
              {state.queueLength}
            </span>
          </div>

          <div className="text-xs font-mono text-[#A1A8BC]">
            <span className="text-[#6E748A]">DONE:</span>{" "}
            <span className="text-[#9BFFB0] font-bold">{completedCount}</span>
          </div>

          {executionTime > 0 && (
            <>
              <div className="h-4 w-px bg-[rgba(255,255,255,0.1)]"></div>
              <div className="text-xs font-mono text-[#6E748A]">
                ⏱ {executionTime}ms
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleReset}
          disabled={state.messages.length === 0}
          className="text-xs px-3 py-1.5 bg-[#0F1426] hover:bg-[#141A30] disabled:bg-[#0A0E1B] disabled:opacity-30 text-[#A1A8BC] rounded font-mono transition-colors border border-[rgba(255,255,255,0.075)] hover:border-[rgba(255,255,255,0.15)]"
          title="Clear all messages"
        >
          ⊗ Reset
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <ChatStream messages={state.messages} />
      </div>

      {/* Command Input */}
      <CommandInput
        onSubmit={handleCommandSubmit}
        disabled={state.state === "executing" || isSubmitting}
      />
    </div>
  );
}
