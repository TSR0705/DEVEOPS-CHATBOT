// Command types for safe user intent parsing
// Explicit string unions are safer than enums as they're more explicit about possible values

export type CommandType = "READ" | "DRY_RUN" | "EXECUTE";
export type ExecuteAction = "SCALE" | "RESTART";

export interface ParsedCommand {
  type: CommandType;
  action?: ExecuteAction;
  targetReplicas?: number;
  rawText: string;
}

/**
 * UserRole — Roles derived SERVER-SIDE, never trusted from client.
 * 
 * WHY SERVER-SIDE ROLE DERIVATION IS MANDATORY:
 * - Client-provided roles can be spoofed
 * - UUID-only identity allows infinite regeneration
 * - Server-side derivation uses Clerk's verified userId
 * - Role assignment is based on server-controlled logic
 * - No trust anchor = no security
 */
export type UserRole = "ADMIN" | "FREE" | "NORMAL";

// Priority levels for command scheduling
// Numeric priority + timestamp guarantees bounded waiting (no starvation)
export type PriorityLevel = 1 | 2 | 3;
// 1 = Admin, 2 = Free (quota remaining), 3 = Normal / Free exhausted

export interface ScheduledCommand {
  id: string;
  userId: string;
  priority: PriorityLevel;
  timestamp: number;
  parsed: ParsedCommand;
}
