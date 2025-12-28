/**
 * PHASE 4 — IDENTITY & QUEUE POLICY
 *
 * This module handles user identity extraction and role derivation.
 *
 * WHY IDENTITY IS RESOLVED AT THE API BOUNDARY:
 * - Early rejection of unauthenticated requests
 * - Identity is established BEFORE any command processing
 * - Role derivation happens server-side with verified data
 * - Scheduler remains identity-agnostic (only sees priority numbers)
 * - Clear separation: identity → priority → scheduling → execution
 *
 * WHY UUID-ONLY IDENTITY IS WEAK:
 * - Can be regenerated infinitely (bypass quota)
 * - No trust anchor (anyone can claim any UUID)
 * - No account lifecycle (no way to ban/throttle)
 * - No role verification (client can claim any role)
 * - Easy abuse (new UUID = fresh quota)
 *
 * WHY CLERK FIXES THIS:
 * - Stable, provider-verified userId
 * - Built-in auth lifecycle
 * - Secure server-side verification
 * - Clean role metadata support
 */

import { auth } from "@clerk/nextjs/server";
import { UserRole, PriorityLevel } from "../scheduler/types";

// ═══════════════════════════════════════════════════════════════════════════
// USER IDENTITY INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * UserIdentity — Verified user identity with derived role.
 *
 * This is the ONLY source of truth for user identity.
 * Never trust client-provided role data.
 */
export interface UserIdentity {
  userId: string;
  role: UserRole;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ALLOWLIST (HARD-CODED)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ADMIN_USER_IDS — Hard-coded allowlist of admin users.
 *
 * ADMIN role is MANUALLY assigned via this allowlist.
 * This is the most secure approach for a demo:
 * - No database needed
 * - No role escalation possible
 * - Explicit, auditable list
 *
 * In production, this would come from a database or Clerk metadata.
 */
const ADMIN_USER_IDS: Set<string> = new Set([
  // Add Clerk user IDs here for admin access
  // Example: "user_2abc123..."
]);

// ═══════════════════════════════════════════════════════════════════════════
// FREE USER QUOTA TRACKING (IN-MEMORY)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * FREE_QUOTA_LIMIT — Maximum EXECUTE commands at FREE priority.
 *
 * FREE users get first 3 EXECUTE commands at priority 2.
 * After that, they're downgraded to NORMAL (priority 3).
 *
 * WHY 3 IS SUFFICIENT FOR DEMO FAIRNESS:
 * - Allows experimentation without abuse
 * - Prevents queue monopolization
 * - Simple, predictable behavior
 * - Resets on server restart (acceptable for demo)
 */
const FREE_QUOTA_LIMIT = 3;

/**
 * userQuotaUsage — In-memory quota tracking.
 *
 * Maps userId → number of EXECUTE commands used.
 *
 * WHY IN-MEMORY IS ACCEPTABLE:
 * - Demo scope (not production)
 * - Resets on restart (gives users fresh quota)
 * - No database complexity
 * - Fast access
 *
 * READ / DRY_RUN commands NEVER count against quota.
 */
const userQuotaUsage: Map<string, number> = new Map();

// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * getUserIdentity — Extract and verify user identity from request.
 *
 * This function:
 * 1. Uses Clerk server SDK to get authenticated userId
 * 2. Rejects unauthenticated requests
 * 3. Derives role server-side (NEVER trusts client)
 * 4. Returns verified UserIdentity
 *
 * WHY SERVER-SIDE ROLE DERIVATION IS MANDATORY:
 * - Client-provided roles can be spoofed
 * - Clerk provides verified userId
 * - Role is determined by server logic only
 * - No trust anchor = no security
 *
 * @throws Error if user is not authenticated
 */
export async function getUserIdentity(): Promise<UserIdentity> {
  // Get authenticated user from Clerk
  const { userId } = await auth();

  // Reject unauthenticated requests
  if (!userId) {
    throw new Error("Unauthorized: No authenticated user");
  }

  // Derive role server-side
  const role = deriveRole(userId);

  return { userId, role };
}

/**
 * deriveRole — Determine user role based on server-side logic.
 *
 * Role derivation hierarchy:
 * 1. ADMIN: Check hard-coded allowlist
 * 2. FREE: Default for signed-in users (quota not exhausted)
 * 3. NORMAL: After FREE quota exhausted
 *
 * This function NEVER trusts client-provided data.
 */
function deriveRole(userId: string): UserRole {
  // Check admin allowlist first
  if (ADMIN_USER_IDS.has(userId)) {
    return "ADMIN";
  }

  // Check quota usage
  const used = userQuotaUsage.get(userId) || 0;
  if (used < FREE_QUOTA_LIMIT) {
    return "FREE";
  }

  // Quota exhausted → NORMAL
  return "NORMAL";
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTA MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * incrementQuota — Increment EXECUTE command quota for a user.
 *
 * Called ONLY for EXECUTE commands.
 * READ / DRY_RUN commands never count against quota.
 *
 * @param userId - The Clerk user ID
 */
export function incrementQuota(userId: string): void {
  const current = userQuotaUsage.get(userId) || 0;
  userQuotaUsage.set(userId, current + 1);
}

/**
 * getQuotaRemaining — Get remaining FREE quota for a user.
 *
 * @param userId - The Clerk user ID
 * @returns Number of FREE-priority commands remaining
 */
export function getQuotaRemaining(userId: string): number {
  const used = userQuotaUsage.get(userId) || 0;
  return Math.max(0, FREE_QUOTA_LIMIT - used);
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * mapRoleToPriority — Map UserRole to numeric PriorityLevel.
 *
 * Priority mapping (LOCKED):
 * - ADMIN → 1 (always highest priority)
 * - FREE (quota remaining) → 2 (higher than NORMAL)
 * - NORMAL / FREE exhausted → 3 (standard priority)
 *
 * WHY SCHEDULER MUST REMAIN ROLE-AGNOSTIC:
 * - Scheduler only sees numbers (1, 2, 3)
 * - Role logic is contained in identity module
 * - Scheduler correctness is preserved
 * - Separation of concerns
 * - Easy to audit: identity → priority → scheduling
 *
 * @param role - The derived UserRole
 * @returns The numeric PriorityLevel for scheduling
 */
export function mapRoleToPriority(role: UserRole): PriorityLevel {
  switch (role) {
    case "ADMIN":
      return 1;
    case "FREE":
      return 2;
    case "NORMAL":
      return 3;
  }
}

/**
 * getPriorityForUser — Get priority for a user, considering current quota.
 *
 * This is the main entry point for priority determination.
 * It combines identity and quota logic.
 *
 * @param userId - The Clerk user ID
 * @param role - The derived UserRole
 * @returns The appropriate PriorityLevel
 */
export function getPriorityForUser(
  userId: string,
  role: UserRole
): PriorityLevel {
  // ADMINs always get priority 1
  if (role === "ADMIN") {
    return 1;
  }

  // Check if FREE user still has quota
  const quotaRemaining = getQuotaRemaining(userId);
  if (role === "FREE" && quotaRemaining > 0) {
    return 2;
  }

  // NORMAL or FREE with exhausted quota → priority 3
  return 3;
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST SCENARIOS — BEHAVIOR DOCUMENTATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TEST 1 — ANONYMOUS USER
 * Expected: getUserIdentity() throws "Unauthorized: No authenticated user"
 *           No command enqueued.
 *
 * TEST 2 — FREE USER FIRST 3 COMMANDS
 * Expected: deriveRole() returns "FREE"
 *           getPriorityForUser() returns 2
 *           Commands jump ahead of NORMAL users.
 *
 * TEST 3 — FREE USER 4TH COMMAND
 * Expected: After 3 incrementQuota() calls, quota exhausted
 *           getPriorityForUser() returns 3
 *           Command queued behind higher-priority users.
 *
 * TEST 4 — ADMIN OVERRIDE
 * Expected: Admin in ADMIN_USER_IDS
 *           deriveRole() returns "ADMIN"
 *           getPriorityForUser() returns 1
 *           Admin command always dequeued first.
 *
 * TEST 5 — IDENTITY SPOOF ATTEMPT
 * Scenario: Client sends fake role in request body
 * Expected: Ignored. getUserIdentity() uses Clerk's verified userId.
 *           Server-derived role enforced.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
