/**
 * Chat State Machine for Control Plane
 * STRICT: No other message types allowed
 */

export type ChatState = "idle" | "queued" | "executing";

export type ChatMessage =
  | {
      id: string;
      role: "user";
      content: string;
      ts: number;
    }
  | {
      id: string;
      role: "system";
      state: "queued" | "executing";
      meta?: Record<string, string | number | boolean>;
      ts: number;
    }
  | {
      id: string;
      role: "result";
      status: "success" | "error";
      output: string;
      ts: number;
    };

export interface ChatContextType {
  messages: ChatMessage[];
  state: ChatState;
  queueLength: number;
  currentCommandId: string | null;
}

export type ChatAction =
  | {
      type: "ADD_USER_MESSAGE";
      payload: { id: string; content: string; ts: number };
    }
  | {
      type: "SET_QUEUED";
      payload: {
        id: string;
        meta?: Record<string, string | number | boolean>;
        ts: number;
      };
    }
  | {
      type: "SET_EXECUTING";
      payload: { id: string; ts: number };
    }
  | {
      type: "SET_RESULT";
      payload: {
        id: string;
        status: "success" | "error";
        output: string;
        ts: number;
      };
    }
  | {
      type: "RESET_CHAT";
    };
