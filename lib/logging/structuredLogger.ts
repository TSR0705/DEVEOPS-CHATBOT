

export interface LogEntry {
  executionId: string;
  commandId?: string;
  userId?: string;
  phase: "queued" | "executing" | "completed" | "failed" | "system";
  timestamp: number;
  message: string;
  level: "info" | "error" | "warn";
  metadata?: Record<string, any>;
}

export class StructuredLogger {
  static log(entry: LogEntry): void {
    const logData = {
      ...entry,
      timestamp: entry.timestamp || Date.now(),
    };
    

    console.log(JSON.stringify(logData));
  }

  static info(executionId: string, phase: LogEntry['phase'], message: string, metadata?: Record<string, any>): void {
    this.log({
      executionId,
      phase,
      message,
      level: "info",
      timestamp: Date.now(),
      metadata,
    });
  }

  static error(executionId: string, phase: LogEntry['phase'], message: string, metadata?: Record<string, any>): void {
    this.log({
      executionId,
      phase,
      message,
      level: "error",
      timestamp: Date.now(),
      metadata,
    });
  }

  static warn(executionId: string, phase: LogEntry['phase'], message: string, metadata?: Record<string, any>): void {
    this.log({
      executionId,
      phase,
      message,
      level: "warn",
      timestamp: Date.now(),
      metadata,
    });
  }
}


export function generateExecutionId(): string {
  return 'exec_' + crypto.randomUUID();
}