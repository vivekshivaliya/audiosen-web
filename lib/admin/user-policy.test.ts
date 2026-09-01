import { AdminRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  AdminUserPolicyError,
  assertOwnerCanManageUsers,
  assertSafeAdminUserTransition,
} from "@/lib/admin/user-policy";

const baseTransition = {
  actorId: "owner-1",
  actorRole: AdminRole.OWNER,
  targetId: "owner-2",
  currentRole: AdminRole.OWNER,
  currentActive: true,
  nextRole: AdminRole.OWNER,
  nextActive: true,
  activeOwnerCount: 2,
};

describe("admin user policy", () => {
  it("allows only owners to manage admin users", () => {
    expect(() => assertOwnerCanManageUsers(AdminRole.OWNER)).not.toThrow();
    expect(() => assertOwnerCanManageUsers(AdminRole.ADMIN)).toThrowError(
      new AdminUserPolicyError("OWNER_REQUIRED"),
    );
    expect(() => assertOwnerCanManageUsers(AdminRole.STAFF)).toThrowError(
      new AdminUserPolicyError("OWNER_REQUIRED"),
    );
  });

  it("prevents demoting the last active owner", () => {
    expect(() =>
      assertSafeAdminUserTransition({
        ...baseTransition,
        nextRole: AdminRole.ADMIN,
        activeOwnerCount: 1,
      }),
    ).toThrowError(new AdminUserPolicyError("LAST_ACTIVE_OWNER"));
  });

  it("prevents deactivating the last active owner", () => {
    expect(() =>
      assertSafeAdminUserTransition({
        ...baseTransition,
        actorId: "owner-2",
        nextActive: false,
        activeOwnerCount: 1,
      }),
    ).toThrowError(new AdminUserPolicyError("LAST_ACTIVE_OWNER"));
  });

  it("permits an owner transition when another active owner remains", () => {
    expect(() =>
      assertSafeAdminUserTransition({
        ...baseTransition,
        nextRole: AdminRole.ADMIN,
      }),
    ).not.toThrow();
  });

  it("prevents an owner from deactivating their own current account", () => {
    expect(() =>
      assertSafeAdminUserTransition({
        ...baseTransition,
        actorId: "owner-2",
        nextActive: false,
      }),
    ).toThrowError(new AdminUserPolicyError("SELF_DEACTIVATION"));
  });
});
