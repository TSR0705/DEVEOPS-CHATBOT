

"use client";

import { useReducer, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { chatReducer } from "@/lib/chat/reducer";
import { ChatContextType } from "@/lib/chat/types";
import { ChatStream } from "./ChatStream";
import { CommandInput } from "./CommandInput";
import { useExecutionPolling } from "@/lib/hooks/useExecutionPolling";

const initialState: ChatContextType = {
  messages: [],
  state: "idle",
  queueLength: 0,
  currentCommandId: null,
};

interface ActiveExecution {
  commandId: string;
  executionId: string;
  messageId: string;
}

export function ChatShell() {
  const { user } = useUser();
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [activeExecution, setActiveExecution] = useState<ActiveExecution | null>(null);

  const userRole = user?.publicMetadata?.role as string || 'FREE';
  const isAdmin = userRole === 'ADMIN';

  // Handle execution state changes from polling
  const handleExecutionStateChange = useCallback((
    newState: 'queued' | 'executing' | 'completed' | 'failed',
    result?: any
  ) => {
    if (!activeExecution) return;

    const now = Date.now();

    switch (newState) {
      case 'queued':
        dispatch({
          type: "SET_QUEUED",
          payload: { id: activeExecution.messageId, ts: now },
        });
        break;

      case 'executing':
        dispatch({
          type: "SET_EXECUTING",
          payload: { id: activeExecution.messageId, ts: now },
        });
        break;

      case 'completed':
      case 'failed':
        const isSuccess = newState === 'completed';
        dispatch({
          type: "SET_RESULT",
          payload: {
            id: activeExecution.messageId,
            status: isSuccess ? "success" : "error",
            output: result?.message || (isSuccess ? "Command completed successfully" : "Command failed"),
            commandId: activeExecution.commandId,
            executionId: activeExecution.executionId,
            proof: result?.proof,
            ts: now,
          },
        });
        setActiveExecution(null);
        break;
    }
  }, [activeExecution]);

  // Setup execution polling
  useExecutionPolling({
    commandId: activeExecution?.commandId,
    executionId: activeExecution?.executionId,
    onStateChange: handleExecutionStateChange,
    enabled: !!activeExecution,
  });

  const handleCommandSubmit = useCallback(async (command: string) => {
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = Date.now();

    // Add user message
    dispatch({
      type: "ADD_USER_MESSAGE",
      payload: { id: commandId, content: command, ts: now },
    });

    setIsSubmitting(true);
    const startTime = Date.now();

    try {
      // Call real API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: command }),
      });

      const result = await response.json();
      const elapsed = Date.now() - startTime;
      setExecutionTime(elapsed);

      if (response.ok) {
        // Update quota if provided
        if (result.user?.quotaRemaining !== undefined) {
          setQuotaRemaining(result.user.quotaRemaining);
        }

        const systemMessageId = `${commandId}-system`;

        // Handle different command types
        if (result.type === "HELP") {
          // Show help panel
          dispatch({
            type: "SET_HELP_RESPONSE",
            payload: {
              id: systemMessageId,
              helpContent: result.help,
              ts: now,
            },
          });

        } else if (result.type === "READ") {
          // Show read result with enhanced data
          dispatch({
            type: "SET_READ_RESPONSE",
            payload: {
              id: systemMessageId,
              subtype: result.subtype,
              data: result.data,
              system: result.system,
              kubernetes: result.kubernetes,
              pods: result.pods,
              summary: result.summary,
              output: result.message || result.error || 'Read operation completed',
              ts: now,
            },
          });

        } else if (result.type === "DRY_RUN") {
          // Show dry run simulation with enhanced preview
          dispatch({
            type: "SET_DRYRUN_RESPONSE",
            payload: {
              id: systemMessageId,
              action: result.action,
              preview: result.preview,
              simulation: result.simulation,
              output: result.message,
              ts: now,
            },
          });

        } else if (result.type === "EXECUTE") {
          // Show accepted state immediately with enhanced data
          dispatch({
            type: "SET_ACCEPTED",
            payload: {
              id: systemMessageId,
              commandId: result.commandId,
              executionId: result.executionId,
              action: result.action,
              target: result.target,
              intent: result.intent,
              before: result.before,
              after: result.after,
              phase: result.phase,
              meta: {
                action: result.command?.action,
                targetReplicas: result.command?.targetReplicas,
                queuePosition: result.execution?.queuePosition,
                priority: result.execution?.priorityLabel,
                estimatedWait: result.execution?.estimatedWaitTime,
              },
              ts: now,
            },
          });

          // Start tracking execution
          setActiveExecution({
            commandId: result.commandId,
            executionId: result.executionId,
            messageId: systemMessageId,
          });

          // Update queue length
          if (result.execution?.queuePosition) {
            dispatch({
              type: "UPDATE_QUEUE_LENGTH",
              payload: result.execution.queuePosition,
            });
          }
        }

      } else {
        // Handle error response
        const errorMessage = result.error || 'Unknown error';
        const suggestions = result.suggestions || [];
        
        const fullErrorMessage = [
          `Error: ${errorMessage}`,
          `Type: ${result.errorType || 'UNKNOWN'}`,
          `Time: ${elapsed}ms`,
          ...(suggestions.length > 0 ? ['', 'Suggestions:', ...suggestions.map((s: string) => `• ${s}`)] : [])
        ].join('\n');

        dispatch({
          type: "SET_RESULT",
          payload: {
            id: `${commandId}-system`,
            status: "error",
            output: fullErrorMessage,
            ts: Date.now(),
          },
        });
      }
    } catch (error) {
      const elapsed = Date.now() - startTime;
      setExecutionTime(elapsed);

      dispatch({
        type: "SET_RESULT",
        payload: {
          id: `${commandId}-system`,
          status: "error",
          output: `Network Error: ${error instanceof Error ? error.message : "Failed to connect to server"}\nTime: ${elapsed}ms`,
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
    setQuotaRemaining(null);
    setActiveExecution(null);
  }, []);

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

          {/* Role and Quota Info */}
          <div className="h-4 w-px bg-[rgba(255,255,255,0.1)]"></div>
          
          <div className="text-xs font-mono">
            <span className="text-[#6E748A]">ROLE:</span>{" "}
            <span className={`font-bold ${isAdmin ? 'text-[#C084FC]' : 'text-[#6EDBD6]'}`}>
              {userRole}
            </span>
          </div>

          {!isAdmin && quotaRemaining !== null && (
            <div className="text-xs font-mono">
              <span className="text-[#6E748A]">QUOTA:</span>{" "}
              <span className={`font-bold ${quotaRemaining > 0 ? 'text-[#9BFFB0]' : 'text-[#D6A65A]'}`}>
                {quotaRemaining}
              </span>
            </div>
          )}

          {executionTime > 0 && (
            <>
              <div className="h-4 w-px bg-[rgba(255,255,255,0.1)]"></div>
              <div className="text-xs font-mono text-[#6E748A]">
                ⏱ {executionTime}ms
              </div>
            </>
          )}

          {/* Active Execution Indicator */}
          {activeExecution && (
            <>
              <div className="h-4 w-px bg-[rgba(255,255,255,0.1)]"></div>
              <div className="text-xs font-mono text-[#D6A65A]">
                🔄 TRACKING: {activeExecution.executionId.slice(-8)}
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
        placeholder={
          !isAdmin && quotaRemaining === 0 
            ? "Quota exceeded - commands will be queued" 
            : "Try: help, status, scale loadlab to 3, dry run scale loadlab to 5"
        }
      />
    </div>
  );
}
