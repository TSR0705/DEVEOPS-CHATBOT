
export type CommandType = "HELP" | "READ" | "DRY_RUN" | "EXECUTE";
export type ExecuteAction = "SCALE" | "RESTART";

export interface ParsedCommand {
  type: CommandType;
  action?: ExecuteAction;
  targetReplicas?: number;
  rawText: string;
}

export type UserRole = "ADMIN" | "FREE" | "NORMAL";

export type PriorityLevel = 1 | 2 | 3;

export interface ScheduledCommand {
  id: string;
  executionId: string;
  userId: string;
  priority: PriorityLevel;
  timestamp: number;
  parsed: ParsedCommand;
}
