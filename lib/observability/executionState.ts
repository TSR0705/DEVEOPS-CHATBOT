

export interface SanitizedCommand {
  action: string;
  requestedReplicas?: number;
}

export interface LastResult {
  status: "success" | "failed" | "rejected" | null;
  message: string;
  timestamp: number;
}

export interface LastError {
  type: string;
  message: string;
  timestamp: number;
}

export interface ExecutionState {
  workerStatus: "idle" | "executing";
  queueLength: number;
  currentCommand: SanitizedCommand | null;
  lastResult: LastResult;
  lastError: LastError | null;
  uptimeMs: number;
  mutexStatus: "free" | "locked";
}

const startTime = Date.now();

const executionState: ExecutionState = {
  workerStatus: "idle",
  queueLength: 0,
  currentCommand: null,
  lastResult: {
    status: null,
    message: "System initialized",
    timestamp: Date.now(),
  },
  lastError: null,
  uptimeMs: 0,
  mutexStatus: "free",
};


export function getExecutionState(): ExecutionState {
  return {
    workerStatus: executionState.workerStatus,
    queueLength: executionState.queueLength,
    currentCommand: executionState.currentCommand ? { ...executionState.currentCommand } : null,
    lastResult: { ...executionState.lastResult },
    lastError: executionState.lastError ? { ...executionState.lastError } : null,
    uptimeMs: Date.now() - startTime,
    mutexStatus: executionState.mutexStatus,
  };
}


export function setWorkerStatus(status: "idle" | "executing"): void {
  executionState.workerStatus = status;
}


export function setQueueLength(length: number): void {
  executionState.queueLength = length;
}


export function setCurrentCommand(command: { parsed?: { action?: string; targetReplicas?: number } } | null): void {
  if (!command) {
    executionState.currentCommand = null;
    return;
  }

  executionState.currentCommand = {
    action: command.parsed?.action || "unknown",
    requestedReplicas: command.parsed?.targetReplicas || undefined,
  };
}


export function setLastResult(status: "success" | "failed" | "rejected", message: string): void {
  executionState.lastResult = {
    status,
    message,
    timestamp: Date.now(),
  };
}


export function setLastError(type: string, message: string): void {
  executionState.lastError = {
    type,
    message,
    timestamp: Date.now(),
  };
}


export function setMutexStatus(status: "free" | "locked"): void {
  executionState.mutexStatus = status;
}