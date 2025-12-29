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
      state: "accepted" | "queued" | "executing";
      commandId?: string;
      executionId?: string;
      action?: string;
      target?: string;
      intent?: "scale-up" | "scale-down" | "maintain";
      before?: {
        replicas: number;
        readyReplicas?: number;
        deployment?: string;
        namespace?: string;
      };
      after?: {
        replicas: number;
        deployment?: string;
        namespace?: string;
      };
      phase?: "queued" | "executing" | "completed";
      meta?: Record<string, string | number | boolean>;
      ts: number;
    }
  | {
      id: string;
      role: "result";
      status: "success" | "error";
      output: string;
      commandId?: string;
      executionId?: string;
      proof?: any;
      ts: number;
    }
  | {
      id: string;
      role: "help";
      helpContent: {
        sections: Array<{
          title: string;
          content: string[];
        }>;
        version: string;
        timestamp: number;
      };
      ts: number;
    }
  | {
      id: string;
      role: "read";
      subtype?: "STATUS" | "PODS";
      data?: {
        query: string;
        suggestion?: string;
      };
      system?: {
        worker: "idle" | "executing";
        queueLength: number;
        currentCommand?: any;
        lastResult?: any;
        uptime?: number;
      };
      kubernetes?: {
        deployment: string;
        namespace: string;
        replicas: number;
        readyReplicas: number;
        totalPods: number;
        readyPods: number;
      };
      pods?: Array<{
        name: string;
        status: string;
        ready: boolean;
        uptime: number;
      }>;
      summary?: {
        total: number;
        ready: number;
        deployment: string;
        namespace: string;
      };
      output: string;
      ts: number;
    }
  | {
      id: string;
      role: "dryrun";
      action?: string;
      preview?: {
        before?: { replicas: number };
        after?: { replicas: number };
        direction?: "scale-up" | "scale-down" | "no-change";
        deployment?: string;
        namespace?: string;
        action?: string;
        effect?: string;
      };
      simulation: {
        action?: string;
        targetReplicas?: number;
        warnings: string[];
        wouldExecute: boolean;
        willExecute: boolean;
      };
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
      type: "SET_HELP_RESPONSE";
      payload: {
        id: string;
        helpContent: {
          sections: Array<{
            title: string;
            content: string[];
          }>;
          version: string;
          timestamp: number;
        };
        ts: number;
      };
    }
  | {
      type: "SET_READ_RESPONSE";
      payload: {
        id: string;
        subtype?: "STATUS" | "PODS";
        data?: {
          query: string;
          suggestion?: string;
        };
        system?: {
          worker: "idle" | "executing";
          queueLength: number;
          currentCommand?: any;
          lastResult?: any;
          uptime?: number;
        };
        kubernetes?: {
          deployment: string;
          namespace: string;
          replicas: number;
          readyReplicas: number;
          totalPods: number;
          readyPods: number;
        };
        pods?: Array<{
          name: string;
          status: string;
          ready: boolean;
          uptime: number;
        }>;
        summary?: {
          total: number;
          ready: number;
          deployment: string;
          namespace: string;
        };
        output: string;
        ts: number;
      };
    }
  | {
      type: "SET_DRYRUN_RESPONSE";
      payload: {
        id: string;
        action?: string;
        preview?: {
          before?: { replicas: number };
          after?: { replicas: number };
          direction?: "scale-up" | "scale-down" | "no-change";
          deployment?: string;
          namespace?: string;
          action?: string;
          effect?: string;
        };
        simulation: {
          action?: string;
          targetReplicas?: number;
          warnings: string[];
          wouldExecute: boolean;
          willExecute: boolean;
        };
        output: string;
        ts: number;
      };
    }
  | {
      type: "SET_ACCEPTED";
      payload: {
        id: string;
        commandId: string;
        executionId: string;
        action?: string;
        target?: string;
        intent?: "scale-up" | "scale-down" | "maintain";
        before?: {
          replicas: number;
          readyReplicas?: number;
          deployment?: string;
          namespace?: string;
        };
        after?: {
          replicas: number;
          deployment?: string;
          namespace?: string;
        };
        phase?: "queued" | "executing" | "completed";
        meta?: Record<string, string | number | boolean>;
        ts: number;
      };
    }
  | {
      type: "SET_QUEUED";
      payload: {
        id: string;
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
        commandId?: string;
        executionId?: string;
        proof?: any;
        ts: number;
      };
    }
  | {
      type: "UPDATE_QUEUE_LENGTH";
      payload: number;
    }
  | {
      type: "RESET_CHAT";
    };
