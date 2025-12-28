/**
 * PHASE 4 — CHAT API ROUTE (POLICY GATE)
 *
 * This route is the ENTRY POINT for all user commands.
 * It acts as a POLICY GATE — authenticating users, parsing commands,
 * assigning priorities, and enqueuing to the scheduler.
 *
 * CRITICAL: This route NEVER executes commands.
 *
 * Flow:
 * 1. Authenticate user via Clerk
 * 2. Resolve UserIdentity (server-side role derivation)
 * 3. Parse command
 * 4. If READ / DRY_RUN → respond immediately
 * 5. If EXECUTE:
 *    - Assign priority from identity
 *    - Increment quota (for FREE users)
 *    - Enqueue ScheduledCommand
 *    - Return queue acknowledgment
 *
 * FORBIDDEN HERE:
 * - No execution
 * - No Kubernetes calls
 * - No mutex usage
 * - No role logic outside identity module
 */

import { NextRequest } from "next/server";
import { parseCommand } from "../../../lib/parser/parseCommand";
import {
  getUserIdentity,
  incrementQuota,
  getPriorityForUser,
  getQuotaRemaining,
} from "../../../lib/auth/identity";
import { ScheduledCommand, PriorityLevel } from "../../../lib/scheduler/types";
import { PriorityQueue } from "../../../lib/scheduler/priorityQueue";

// ═══════════════════════════════════════════════════════════════════════════
// SHARED QUEUE INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Singleton priority queue for command scheduling.
 * Worker pulls from this queue.
 *
 * WHY SINGLETON:
 * - Single source of truth
 * - Worker and API share same queue
 * - No race conditions on queue access
 */
const queue = new PriorityQueue();

/**
 * getQueue — Export queue for worker access.
 */
export function getQueue(): PriorityQueue {
  return queue;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND ID GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * generateCommandId — Generate unique command ID.
 *
 * Uses timestamp + random suffix for uniqueness.
 * Not cryptographically secure, but sufficient for command tracking.
 */
function generateCommandId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `cmd_${timestamp}_${random}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// POST HANDLER — COMMAND ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: AUTHENTICATE USER
    // ─────────────────────────────────────────────────────────────────────
    let identity;
    try {
      identity = await getUserIdentity();
    } catch (authError) {
      // Unauthenticated request → reject
      return Response.json(
        { error: "Unauthorized: Please sign in to use DeployBot" },
        { status: 401 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: PARSE REQUEST BODY
    // ─────────────────────────────────────────────────────────────────────
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Bad Request: 'message' field is required" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: PARSE COMMAND
    // ─────────────────────────────────────────────────────────────────────
    const parsed = parseCommand(message);

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: HANDLE READ / DRY_RUN — IMMEDIATE RESPONSE
    // ─────────────────────────────────────────────────────────────────────
    if (parsed.type === "READ" || parsed.type === "DRY_RUN") {
      // READ and DRY_RUN commands don't need scheduling
      // They don't mutate anything, so respond immediately
      // NOTE: In a full implementation, this would fetch status
      return Response.json({
        type: parsed.type,
        message:
          parsed.type === "READ"
            ? "Status query received. Use getStatus endpoint for current state."
            : "Simulation request received. No changes would be made.",
        parsed,
        userId: identity.userId,
        role: identity.role,
      });
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: HANDLE EXECUTE — ENQUEUE TO SCHEDULER
    // ─────────────────────────────────────────────────────────────────────

    // Get priority based on identity and quota
    const priority: PriorityLevel = getPriorityForUser(
      identity.userId,
      identity.role
    );

    // Get quota remaining BEFORE incrementing (for response)
    const quotaBefore = getQuotaRemaining(identity.userId);

    // Increment quota for FREE users (EXECUTE commands only)
    if (identity.role === "FREE") {
      incrementQuota(identity.userId);
    }

    // Create scheduled command
    const scheduledCommand: ScheduledCommand = {
      id: generateCommandId(),
      userId: identity.userId,
      priority,
      timestamp: Date.now(),
      parsed,
    };

    // Enqueue to priority queue
    queue.enqueue(scheduledCommand);

    // Return acknowledgment (NOT execution result)
    return Response.json({
      status: "queued",
      commandId: scheduledCommand.id,
      priority,
      queuePosition: queue.size(),
      role: identity.role,
      quotaRemaining: identity.role === "FREE" ? quotaBefore - 1 : undefined,
      message:
        `Command enqueued with priority ${priority}. ` +
        (priority === 1
          ? "Admin priority."
          : priority === 2
            ? "Free tier priority."
            : "Normal priority."),
      parsed,
    });
  } catch (error) {
    // Generic error handler
    return Response.json(
      { error: "Failed to process command" },
      { status: 500 }
    );
  }
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE NOTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This route is a POLICY GATE, not an executor.
 *
 * What happens here:
 * - Authentication (Clerk)
 * - Identity resolution (server-side role)
 * - Command parsing
 * - Priority assignment
 * - Queue enqueue
 *
 * What NEVER happens here:
 * - Kubernetes mutations
 * - Mutex acquisition
 * - Command execution
 * - Worker logic
 *
 * The worker (separate process/loop) pulls from the queue and executes.
 * This route returns immediately after enqueueing.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
