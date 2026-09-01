import { AdminRole } from "@prisma/client";

export type AdminUserPolicyCode =
  | "OWNER_REQUIRED"
  | "LAST_ACTIVE_OWNER"
  | "SELF_DEACTIVATION";

export class AdminUserPolicyError extends Error {
  constructor(public readonly code: AdminUserPolicyCode) {
    super(code);
    this.name = "AdminUserPolicyError";
  }
}

export function assertOwnerCanManageUsers(role: AdminRole): void {
  if (role !== AdminRole.OWNER) {
    throw new AdminUserPolicyError("OWNER_REQUIRED");
  }
}

export function assertSafeAdminUserTransition({
  actorId,
  actorRole,
  targetId,
  currentRole,
  currentActive,
  nextRole,
  nextActive,
  activeOwnerCount,
}: {
  actorId: string;
  actorRole: AdminRole;
  targetId: string;
  currentRole: AdminRole;
  currentActive: boolean;
  nextRole: AdminRole;
  nextActive: boolean;
  activeOwnerCount: number;
}): void {
  assertOwnerCanManageUsers(actorRole);

  const removesActiveOwner =
    currentActive &&
    currentRole === AdminRole.OWNER &&
    (!nextActive || nextRole !== AdminRole.OWNER);

  if (removesActiveOwner && activeOwnerCount <= 1) {
    throw new AdminUserPolicyError("LAST_ACTIVE_OWNER");
  }

  if (actorId === targetId && currentActive && !nextActive) {
    throw new AdminUserPolicyError("SELF_DEACTIVATION");
  }
}
