

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

    case "SET_HELP_RESPONSE": {
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: "help",
            helpContent: action.payload.helpContent,
            ts: action.payload.ts,
          },
        ],
      };
    }

    case "SET_READ_RESPONSE": {
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: "read",
            subtype: action.payload.subtype,
            data: action.payload.data,
            system: action.payload.system,
            kubernetes: action.payload.kubernetes,
            pods: action.payload.pods,
            summary: action.payload.summary,
            output: action.payload.output,
            ts: action.payload.ts,
          },
        ],
      };
    }

    case "SET_DRYRUN_RESPONSE": {
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: "dryrun",
            action: action.payload.action,
            preview: action.payload.preview,
            simulation: action.payload.simulation,
            output: action.payload.output,
            ts: action.payload.ts,
          },
        ],
      };
    }

    case "SET_ACCEPTED": {
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            role: "system",
            state: "accepted",
            commandId: action.payload.commandId,
            executionId: action.payload.executionId,
            action: action.payload.action,
            target: action.payload.target,
            intent: action.payload.intent,
            before: action.payload.before,
            after: action.payload.after,
            phase: action.payload.phase,
            meta: action.payload.meta,
            ts: action.payload.ts,
          },
        ],
        queueLength: state.queueLength + 1,
      };
    }

    case "SET_QUEUED": {
      const updatedMessages = state.messages.map(msg => {
        if (
          msg.role === "system" &&
          msg.state === "accepted" &&
          msg.id === action.payload.id
        ) {
          return {
            ...msg,
            state: "queued" as const,
            ts: action.payload.ts,
          };
        }
        return msg;
      });

      return {
        ...state,
        messages: updatedMessages,
        state: "queued",
      };
    }

    case "SET_EXECUTING": {
      if (state.currentCommandId !== null) {
        console.warn(
          "chatReducer: Attempted to execute while already executing. This should not happen."
        );
        return state;
      }

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
      const resultMessageId = `${action.payload.id}-result`;

      const newResultMessage = {
        id: resultMessageId,
        role: "result" as const,
        status: action.payload.status,
        output: action.payload.output,
        commandId: action.payload.commandId,
        executionId: action.payload.executionId,
        proof: action.payload.proof,
        ts: action.payload.ts,
      };

      const nextState = state.queueLength > 0 ? "queued" : "idle";

      return {
        ...state,
        messages: [...state.messages, newResultMessage],
        state: nextState,
        currentCommandId: null,
      };
    }

    case "UPDATE_QUEUE_LENGTH": {
      return {
        ...state,
        queueLength: action.payload,
      };
    }

    case "RESET_CHAT": {
      return initialState;
    }

    default:
      return state;
  }
}
