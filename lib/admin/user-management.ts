import { AdminRole, Prisma } from "@prisma/client";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import {
  AdminUserPolicyError,
  assertOwnerCanManageUsers,
  assertSafeAdminUserTransition,
} from "@/lib/admin/user-policy";

export const managedAdminEmailSchema = z
  .string()
  .trim()
  .max(320)
  .email()
  .transform((email) => email.toLowerCase());

export const managedAdminRoleSchema = z.nativeEnum(AdminRole);

export type AdminUserManagementCode =
  | "EMAIL_EXISTS"
  | "USER_NOT_FOUND"
  | "NO_CHANGE";

export class AdminUserManagementError extends Error {
  constructor(public readonly code: AdminUserManagementCode) {
    super(code);
    this.name = "AdminUserManagementError";
  }
}

export type AdminUserActor = Readonly<{
  id: string;
  role: AdminRole;
}>;

const transactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
} as const;

async function requireCurrentOwner(
  transaction: Prisma.TransactionClient,
  actor: AdminUserActor,
) {
  const current = await transaction.adminUser.findUnique({
    where: { id: actor.id },
    select: { id: true, role: true, active: true },
  });
  if (!current?.active) throw new AdminUserPolicyError("OWNER_REQUIRED");
  assertOwnerCanManageUsers(current.role);
  return current;
}

export async function addManagedAdminUser({
  actor,
  email,
  role,
  active,
}: {
  actor: AdminUserActor;
  email: string;
  role: AdminRole;
  active: boolean;
}) {
  assertOwnerCanManageUsers(actor.role);
  const normalizedEmail = managedAdminEmailSchema.parse(email);
  const normalizedRole = managedAdminRoleSchema.parse(role);

  return getPrisma().$transaction(async (transaction) => {
    const currentOwner = await requireCurrentOwner(transaction, actor);
    const existing = await transaction.adminUser.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) throw new AdminUserManagementError("EMAIL_EXISTS");

    const created = await transaction.adminUser.create({
      data: {
        email: normalizedEmail,
        role: normalizedRole,
        active,
      },
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
      },
    });

    await transaction.auditLog.create({
      data: {
        actorId: currentOwner.id,
        action: "admin_user.added",
        entityType: "AdminUser",
        entityId: created.id,
        metadata: {
          role: created.role,
          active: created.active,
        },
      },
    });

    return created;
  }, transactionOptions);
}

export async function changeManagedAdminRole({
  actor,
  targetId,
  role,
}: {
  actor: AdminUserActor;
  targetId: string;
  role: AdminRole;
}) {
  assertOwnerCanManageUsers(actor.role);
  const normalizedRole = managedAdminRoleSchema.parse(role);

  return getPrisma().$transaction(async (transaction) => {
    const currentOwner = await requireCurrentOwner(transaction, actor);
    const target = await transaction.adminUser.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, active: true },
    });
    if (!target) throw new AdminUserManagementError("USER_NOT_FOUND");
    if (target.role === normalizedRole) throw new AdminUserManagementError("NO_CHANGE");

    const activeOwnerCount = await transaction.adminUser.count({
      where: { role: AdminRole.OWNER, active: true },
    });
    assertSafeAdminUserTransition({
      actorId: currentOwner.id,
      actorRole: currentOwner.role,
      targetId: target.id,
      currentRole: target.role,
      currentActive: target.active,
      nextRole: normalizedRole,
      nextActive: target.active,
      activeOwnerCount,
    });

    const updated = await transaction.adminUser.update({
      where: { id: target.id },
      data: { role: normalizedRole },
      select: { id: true, role: true, active: true },
    });
    await transaction.auditLog.create({
      data: {
        actorId: currentOwner.id,
        action: "admin_user.role_changed",
        entityType: "AdminUser",
        entityId: target.id,
        metadata: {
          from: target.role,
          to: updated.role,
        },
      },
    });

    return updated;
  }, transactionOptions);
}

export async function changeManagedAdminActiveState({
  actor,
  targetId,
  active,
}: {
  actor: AdminUserActor;
  targetId: string;
  active: boolean;
}) {
  assertOwnerCanManageUsers(actor.role);

  return getPrisma().$transaction(async (transaction) => {
    const currentOwner = await requireCurrentOwner(transaction, actor);
    const target = await transaction.adminUser.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, active: true },
    });
    if (!target) throw new AdminUserManagementError("USER_NOT_FOUND");
    if (target.active === active) throw new AdminUserManagementError("NO_CHANGE");

    const activeOwnerCount = await transaction.adminUser.count({
      where: { role: AdminRole.OWNER, active: true },
    });
    assertSafeAdminUserTransition({
      actorId: currentOwner.id,
      actorRole: currentOwner.role,
      targetId: target.id,
      currentRole: target.role,
      currentActive: target.active,
      nextRole: target.role,
      nextActive: active,
      activeOwnerCount,
    });

    const updated = await transaction.adminUser.update({
      where: { id: target.id },
      data: { active },
      select: { id: true, role: true, active: true },
    });
    const revoked = active
      ? { count: 0 }
      : await transaction.adminSession.updateMany({
          where: { adminUserId: target.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
    await transaction.auditLog.create({
      data: {
        actorId: currentOwner.id,
        action: active ? "admin_user.activated" : "admin_user.deactivated",
        entityType: "AdminUser",
        entityId: target.id,
        metadata: {
          from: target.active,
          to: updated.active,
          revokedSessions: revoked.count,
        },
      },
    });

    return updated;
  }, transactionOptions);
}

export function adminUserManagementNotice(error: unknown): string {
  if (error instanceof AdminUserPolicyError) return error.code.toLowerCase();
  if (error instanceof AdminUserManagementError) return error.code.toLowerCase();
  if (error instanceof z.ZodError) return "invalid_input";
  return "change_failed";
}
