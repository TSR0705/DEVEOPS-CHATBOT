/**
 * Pure Chat Reducer
 * - No fetch, no timers, no side effects
 * - Only ONE executing command at a time
 * - Queue position preserved
 */

import { ChatContextType, ChatAction } from "./types";

const initialState: ChatContextType = {
  messages: [],
  state: "idle",
  queueLength: 0,
  currentCommandId: null,
};

export function chatReducer(
  state: ChatContextType = initialState,
  action: ChatAction
): ChatContextType {
  switch (action.type) {
    case "ADD_USER_MESSAGE": {
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: "user",
            content: action.payload.content,
            ts: action.payload.ts,
          },
        ],
      };
    }

    case "SET_QUEUED": {
      // Enqueue system message, increment queue
      const newQueueLength = state.queueLength + 1;
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: "system",
            state: "queued",
            meta: action.payload.meta,
            ts: action.payload.ts,
          },
        ],
        queueLength: newQueueLength,
      };
    }

    case "SET_EXECUTING": {
      // Only ONE executing at a time
      // Decrement queue, set current command
      if (state.currentCommandId !== null) {
        console.warn(
          "chatReducer: Attempted to execute while already executing. This should not happen."
        );
        return state;
      }

      // Find queued message and update it
      const updatedMessages = state.messages.map(msg => {
        if (
          msg.role === "system" &&
          msg.state === "queued" &&
          msg.id === action.payload.id
        ) {
          return {
            ...msg,
            state: "executing" as const,
            ts: action.payload.ts,
          };
        }
        return msg;
      });

      return {
        ...state,
        messages: updatedMessages,
        state: "executing",
        currentCommandId: action.payload.id,
        queueLength: Math.max(0, state.queueLength - 1),
      };
    }

    case "SET_RESULT": {
      // Execution complete, clear current command
      // Add result message with a unique ID to avoid key conflicts
      const resultMessageId = `${action.payload.id}-result`;

      // Add result message
      const newResultMessage = {
        id: resultMessageId,
        role: "result" as const,
        status: action.payload.status,
        output: action.payload.output,
        ts: action.payload.ts,
      };

      // If queue is not empty, stay queued, else idle
      const nextState = state.queueLength > 0 ? "queued" : "idle";

      return {
        ...state,
        messages: [...state.messages, newResultMessage],
        state: nextState,
        currentCommandId: null,
      };
    }

    case "RESET_CHAT": {
      return initialState;
    }

    default:
      return state;
  }
}
