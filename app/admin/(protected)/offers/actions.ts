"use server";

import { AdminRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import {
  createOfferDraft,
  offerManagementNotice,
  setOfferEnabled,
  updateOfferDetails,
  updateOfferMappings,
} from "@/lib/admin/offer-management";

const text = z.string();
const identifier = z.string().uuid();
const intentSchema = z.enum(["enable", "disable"]);

function finish(notice: string): never {
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  revalidatePath("/offers/50-percent-off");
  revalidatePath("/hearing-aid-rental");
  revalidatePath("/care-plans");
  revalidatePath("/hearing-aid-trial");
  redirect(`/admin/offers?notice=${encodeURIComponent(notice)}`);
}

export async function createOfferDraftAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await createOfferDraft({
      actor: admin,
      slug: text.parse(formData.get("slug")),
      title: text.parse(formData.get("title")),
    });
  } catch (error) {
    finish(offerManagementNotice(error));
  }
  finish("draft_created");
}

export async function updateOfferDetailsAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await updateOfferDetails({
      actor: admin,
      offerId: identifier.parse(formData.get("offerId")),
      title: text.parse(formData.get("title")),
      summary: text.parse(formData.get("summary")),
      maximumDiscountPct: text.parse(formData.get("maximumDiscountPct")),
      terms: text.parse(formData.get("terms")),
      startsAt: text.parse(formData.get("startsAt")),
      endsAt: text.parse(formData.get("endsAt")),
    });
  } catch (error) {
    finish(offerManagementNotice(error));
  }
  finish("details_updated");
}

export async function updateOfferMappingsAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await updateOfferMappings({
      actor: admin,
      offerId: identifier.parse(formData.get("offerId")),
      brandIds: z.array(identifier).parse(formData.getAll("brandIds")),
      productIds: z.array(identifier).parse(formData.getAll("productIds")),
      serviceIds: z.array(identifier).parse(formData.getAll("serviceIds")),
    });
  } catch (error) {
    finish(offerManagementNotice(error));
  }
  finish("mappings_updated");
}

export async function setOfferEnabledAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    const intent = intentSchema.parse(formData.get("intent"));
    if (intent === "enable" && formData.get("confirmation") !== "offer_approved") {
      throw new Error("Explicit Owner approval is required.");
    }
    await setOfferEnabled({
      actor: admin,
      offerId: identifier.parse(formData.get("offerId")),
      enabled: intent === "enable",
    });
  } catch (error) {
    finish(offerManagementNotice(error));
  }
  finish("publication_updated");
}
