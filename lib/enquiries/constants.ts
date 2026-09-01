import { clinicContact } from "@/lib/content";

export const ENQUIRY_CONSENT_VERSION = "website-enquiry-v2-2026-08-22";
export const STAFF_ENQUIRY_EMAIL = "vivekshivaliya10@gmail.com";
export const PATIENT_SUPPORT_EMAIL = clinicContact.email;
export const AUDIOSEN_PHONE_DISPLAY = clinicContact.primaryCallDisplay;
export const AUDIOSEN_PHONE_E164 = clinicContact.primaryCallE164;
export const AUDIOSEN_WHATSAPP_URL = `https://wa.me/${clinicContact.whatsappE164.replace(/\D/g, "")}`;
export const AUDIOSEN_URL = "https://audiosen.com";
export const AUDIOSEN_ADDRESS = clinicContact.address;
export const AUDIOSEN_MAPS_URL = clinicContact.mapsHref;

export const ENQUIRY_TYPES = [
  "contact",
  "appointment",
  "consultation",
  "product_enquiry",
  "request_price",
  "offer",
  "home_visit",
  "repair",
  "speech",
  "finder",
  "hearing_aid_finder",
  "trial",
  "callback",
  "audiogram",
  "whatsapp_lead",
] as const;

export type PublicEnquiryType = (typeof ENQUIRY_TYPES)[number];
