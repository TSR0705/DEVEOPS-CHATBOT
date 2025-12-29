import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole, PriorityLevel } from "../scheduler/types";

export interface UserIdentity {
  userId: string;
  role: UserRole;
}

const FREE_QUOTA_LIMIT = 3;

const userQuotaUsage: Map<string, number> = new Map();

export async function getUserIdentity(): Promise<UserIdentity> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: No authenticated user");
  }


  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized: User not found");
  }

  const role = deriveRole(userId, user.publicMetadata?.role as string);

  return { userId, role };
}

function deriveRole(userId: string, metadataRole?: string): UserRole {
  if (metadataRole === "ADMIN") {
    return "ADMIN";
  }

  const used = userQuotaUsage.get(userId) || 0;
  if (used < FREE_QUOTA_LIMIT) {
    return "FREE";
  }

  return "NORMAL";
}

export function incrementQuota(userId: string): void {
  const current = userQuotaUsage.get(userId) || 0;
  userQuotaUsage.set(userId, current + 1);
}

export function getQuotaRemaining(userId: string): number {
  const used = userQuotaUsage.get(userId) || 0;
  return Math.max(0, FREE_QUOTA_LIMIT - used);
}

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

export function getPriorityForUser(
  userId: string,
  role: UserRole
): PriorityLevel {
  if (role === "ADMIN") {
    return 1;
  }

  const quotaRemaining = getQuotaRemaining(userId);
  if (role === "FREE" && quotaRemaining > 0) {
    return 2;
  }

  return 3;
}