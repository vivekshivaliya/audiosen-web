"use server";

import { AdminRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import {
  addManagedAdminUser,
  adminUserManagementNotice,
  changeManagedAdminActiveState,
  changeManagedAdminRole,
  managedAdminEmailSchema,
  managedAdminRoleSchema,
} from "@/lib/admin/user-management";

const identifierSchema = z.string().uuid();
const activeStateSchema = z.enum(["true", "false"]).transform((value) => value === "true");

function finish(notice: string, destination = "/admin/users"): never {
  revalidatePath("/admin/users");
  redirect(`${destination}?notice=${encodeURIComponent(notice)}`);
}

export async function addAdminUserAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);

  try {
    await addManagedAdminUser({
      actor: admin,
      email: managedAdminEmailSchema.parse(formData.get("email")),
      role: managedAdminRoleSchema.parse(formData.get("role")),
      active: activeStateSchema.parse(formData.get("active")),
    });
  } catch (error) {
    finish(adminUserManagementNotice(error));
  }

  finish("user_added");
}

export async function changeAdminUserRoleAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  let targetId = "";
  let role: AdminRole = AdminRole.STAFF;

  try {
    targetId = identifierSchema.parse(formData.get("userId"));
    role = managedAdminRoleSchema.parse(formData.get("role"));
    await changeManagedAdminRole({ actor: admin, targetId, role });
  } catch (error) {
    finish(adminUserManagementNotice(error));
  }

  finish("role_updated", targetId === admin.id && role !== AdminRole.OWNER ? "/admin/enquiries" : "/admin/users");
}

export async function changeAdminUserActiveStateAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);

  try {
    await changeManagedAdminActiveState({
      actor: admin,
      targetId: identifierSchema.parse(formData.get("userId")),
      active: activeStateSchema.parse(formData.get("active")),
    });
  } catch (error) {
    finish(adminUserManagementNotice(error));
  }

  finish("status_updated");
}
