"use server";

import { AdminRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import {
  approveGoogleBusinessSnapshot,
  rejectGoogleBusinessSnapshot,
  selectGoogleAccount,
  selectGoogleLocation,
  setGoogleReviewSelection,
  stageGoogleBusinessSnapshot,
  type GoogleApprovalField,
} from "@/lib/google-business/operations";

const identifier = z.string().uuid();
const accountName = z.string().regex(/^accounts\/[A-Za-z0-9_-]+$/);
const locationName = z.string().regex(/^locations\/[A-Za-z0-9_-]+$/);
const approvalField = z.enum(["address", "hours", "reviewLinks"]);

function finish(notice: string): never {
  revalidatePath("/admin/google-business");
  revalidatePath("/review");
  redirect(`/admin/google-business?notice=${notice}`);
}

export async function chooseGoogleAccountAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await selectGoogleAccount(
      admin.id,
      identifier.parse(formData.get("connectionId")),
      accountName.parse(formData.get("accountName")),
    );
  } catch {
    finish("account_selection_failed");
  }
  finish("account_selected");
}

export async function chooseGoogleLocationAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await selectGoogleLocation(
      admin.id,
      identifier.parse(formData.get("connectionId")),
      locationName.parse(formData.get("locationName")),
    );
  } catch {
    finish("location_selection_failed");
  }
  finish("location_selected");
}

export async function stageGoogleSnapshotAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await stageGoogleBusinessSnapshot(
      admin.id,
      identifier.parse(formData.get("connectionId")),
    );
  } catch {
    finish("sync_failed");
  }
  finish("snapshot_staged");
}

export async function approveGoogleSnapshotAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    if (formData.get("confirm") !== "approve") throw new Error("Confirmation is required.");
    const fields = z.array(approvalField).min(1).parse(formData.getAll("fields"));
    await approveGoogleBusinessSnapshot(
      admin.id,
      identifier.parse(formData.get("snapshotId")),
      fields as GoogleApprovalField[],
    );
  } catch {
    finish("approval_failed");
  }
  finish("snapshot_approved");
}

export async function rejectGoogleSnapshotAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await rejectGoogleBusinessSnapshot(
      admin.id,
      identifier.parse(formData.get("snapshotId")),
    );
  } catch {
    finish("rejection_failed");
  }
  finish("snapshot_rejected");
}

export async function toggleGoogleReviewAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER, AdminRole.ADMIN]);
  try {
    await setGoogleReviewSelection(
      admin.id,
      identifier.parse(formData.get("reviewId")),
      formData.get("selected") === "true",
    );
  } catch {
    finish("review_selection_failed");
  }
  finish("review_selection_updated");
}
