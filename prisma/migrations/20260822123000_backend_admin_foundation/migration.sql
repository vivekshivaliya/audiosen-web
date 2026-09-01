-- CreateEnum
CREATE TYPE "EnquiryType" AS ENUM ('CONTACT', 'CONSULTATION', 'PRODUCT_ENQUIRY', 'REQUEST_PRICE', 'OFFER', 'HOME_VISIT', 'REPAIR', 'SPEECH', 'HEARING_AID_FINDER', 'TRIAL', 'CALLBACK', 'AUDIOGRAM', 'WHATSAPP_LEAD');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'APPOINTMENT_BOOKED', 'QUALIFIED', 'CONVERTED', 'CLOSED', 'SPAM');

-- CreateEnum
CREATE TYPE "AttachmentPurpose" AS ENUM ('DEVICE_PHOTO', 'AUDIOGRAM', 'OTHER');

-- CreateEnum
CREATE TYPE "AttachmentScanStatus" AS ENUM ('PENDING', 'CLEAN', 'REJECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "UploadSessionStatus" AS ENUM ('READY', 'CLAIMED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaRightsStatus" AS ENUM ('UNVERIFIED', 'MANUFACTURER_AUTHORIZED', 'LICENSED', 'OWNED', 'PUBLIC_DOMAIN', 'REJECTED');

-- CreateEnum
CREATE TYPE "GoogleConnectionStatus" AS ENUM ('ACTIVE', 'NEEDS_REAUTH', 'REVOKED');

-- CreateEnum
CREATE TYPE "GoogleSyncStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "GoogleSnapshotApprovalStatus" AS ENUM ('STAGED', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DEAD');

-- CreateEnum
CREATE TYPE "EmailOutboxKind" AS ENUM ('STAFF_ENQUIRY', 'PATIENT_CONFIRMATION');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(32) NOT NULL,
    "idempotencyHash" VARCHAR(64) NOT NULL,
    "requestFingerprint" VARCHAR(64) NOT NULL,
    "type" "EnquiryType" NOT NULL,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320),
    "phone" VARCHAR(30) NOT NULL,
    "city" VARCHAR(80) NOT NULL,
    "age" INTEGER,
    "ageGroup" VARCHAR(80),
    "service" VARCHAR(160) NOT NULL,
    "selectedBrand" VARCHAR(120),
    "selectedDevice" VARCHAR(160),
    "appointmentDate" DATE,
    "appointmentTime" VARCHAR(80),
    "preferredChannel" VARCHAR(40),
    "preferredCallbackTime" VARCHAR(80),
    "homeVisit" BOOLEAN,
    "source" VARCHAR(80) NOT NULL,
    "sourcePath" VARCHAR(500) NOT NULL,
    "landingPage" VARCHAR(500),
    "utmSource" VARCHAR(200),
    "utmMedium" VARCHAR(200),
    "utmCampaign" VARCHAR(200),
    "utmTerm" VARCHAR(200),
    "utmContent" VARCHAR(200),
    "clickIds" JSONB,
    "context" JSONB,
    "consent" BOOLEAN NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" VARCHAR(80) NOT NULL,
    "clientIpHash" VARCHAR(64),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquirySensitiveData" (
    "enquiryId" UUID NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "nonce" VARCHAR(32) NOT NULL,
    "authTag" VARCHAR(32) NOT NULL,
    "keyVersion" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnquirySensitiveData_pkey" PRIMARY KEY ("enquiryId")
);

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" UUID NOT NULL,
    "claimTokenHash" VARCHAR(64) NOT NULL,
    "purpose" "AttachmentPurpose" NOT NULL,
    "status" "UploadSessionStatus" NOT NULL DEFAULT 'READY',
    "enquiryId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryAttachment" (
    "id" UUID NOT NULL,
    "uploadSessionId" UUID NOT NULL,
    "enquiryId" UUID,
    "purpose" "AttachmentPurpose" NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(120) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "scanStatus" "AttachmentScanStatus" NOT NULL DEFAULT 'PENDING',
    "scanDetail" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedAt" TIMESTAMP(3),

    CONSTRAINT "EnquiryAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" UUID NOT NULL,
    "enquiryId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "bodyCiphertext" TEXT NOT NULL,
    "bodyNonce" VARCHAR(32) NOT NULL,
    "bodyAuthTag" VARCHAR(32) NOT NULL,
    "keyVersion" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" UUID NOT NULL,
    "enquiryId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "assignedToId" UUID,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'SCHEDULED',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "noteCiphertext" TEXT,
    "noteNonce" VARCHAR(32),
    "noteAuthTag" VARCHAR(32),
    "keyVersion" VARCHAR(80),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "websiteUrl" VARCHAR(500),
    "logoPath" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sourceUrl" VARCHAR(500),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAid" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "modelName" VARCHAR(180) NOT NULL,
    "style" VARCHAR(100),
    "summary" TEXT,
    "suitableUse" TEXT,
    "rechargeable" BOOLEAN,
    "bluetooth" BOOLEAN,
    "streaming" BOOLEAN,
    "mobileApp" VARCHAR(160),
    "hearingLossSuitability" VARCHAR(240),
    "noiseManagement" VARCHAR(500),
    "warranty" VARCHAR(500),
    "fittingInformation" TEXT,
    "afterCare" TEXT,
    "repairSupport" TEXT,
    "consultationRequired" BOOLEAN NOT NULL DEFAULT true,
    "priceNote" VARCHAR(240),
    "features" JSONB,
    "specifications" JSONB,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceUrl" VARCHAR(500),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "id" UUID NOT NULL,
    "hearingAidId" UUID NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "altText" VARCHAR(240) NOT NULL,
    "contentType" VARCHAR(120) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sourceUrl" VARCHAR(500),
    "rightsStatus" "MediaRightsStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "rightsEvidenceUrl" VARCHAR(1000),
    "rightsNotes" VARCHAR(1000),
    "rightsCheckedAt" TIMESTAMP(3),
    "rightsApprovedAt" TIMESTAMP(3),
    "rightsApprovedBy" VARCHAR(320),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "summary" TEXT,
    "maximumDiscountPct" INTEGER,
    "terms" TEXT,
    "imagePath" VARCHAR(500),
    "landingPage" VARCHAR(500),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "summary" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceUrl" VARCHAR(500),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferService" (
    "offerId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,

    CONSTRAINT "OfferService_pkey" PRIMARY KEY ("offerId","serviceId")
);

-- CreateTable
CREATE TABLE "OfferBrand" (
    "offerId" UUID NOT NULL,
    "brandId" UUID NOT NULL,

    CONSTRAINT "OfferBrand_pkey" PRIMARY KEY ("offerId","brandId")
);

-- CreateTable
CREATE TABLE "OfferHearingAid" (
    "offerId" UUID NOT NULL,
    "hearingAidId" UUID NOT NULL,

    CONSTRAINT "OfferHearingAid_pkey" PRIMARY KEY ("offerId","hearingAidId")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" VARCHAR(40) NOT NULL DEFAULT 'primary',
    "organizationName" VARCHAR(180) NOT NULL,
    "legalName" VARCHAR(180),
    "phone" VARCHAR(30) NOT NULL,
    "whatsapp" VARCHAR(30),
    "email" VARCHAR(320) NOT NULL,
    "websiteUrl" VARCHAR(500) NOT NULL,
    "addressLine1" VARCHAR(240),
    "addressLine2" VARCHAR(240),
    "locality" VARCHAR(120),
    "region" VARCHAR(120),
    "postalCode" VARCHAR(20),
    "countryCode" CHAR(2) NOT NULL DEFAULT 'IN',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "openingHours" JSONB,
    "specialHours" JSONB,
    "googleAccountId" VARCHAR(160),
    "googleLocationId" VARCHAR(160),
    "googlePlaceId" VARCHAR(180),
    "googleMapsUri" VARCHAR(1000),
    "googleReviewUri" VARCHAR(1000),
    "lastGoogleVerifiedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" UUID,
    "sourceSnapshotId" UUID,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleConnection" (
    "id" UUID NOT NULL,
    "connectedById" UUID NOT NULL,
    "googleSubject" VARCHAR(255) NOT NULL,
    "accountId" VARCHAR(160),
    "locationId" VARCHAR(160),
    "encryptedRefreshToken" TEXT NOT NULL,
    "tokenKeyVersion" VARCHAR(80) NOT NULL,
    "scopes" TEXT[],
    "status" "GoogleConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleSnapshot" (
    "id" UUID NOT NULL,
    "connectionId" UUID NOT NULL,
    "syncRunId" UUID,
    "sourceEtag" VARCHAR(255),
    "payload" JSONB NOT NULL,
    "differences" JSONB,
    "approvalStatus" "GoogleSnapshotApprovalStatus" NOT NULL DEFAULT 'STAGED',
    "approvedAt" TIMESTAMP(3),
    "approvedById" UUID,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleReview" (
    "id" UUID NOT NULL,
    "googleReviewName" VARCHAR(500) NOT NULL,
    "sourceSnapshotId" UUID,
    "reviewerDisplayName" VARCHAR(180) NOT NULL,
    "reviewerAvatarUrl" VARCHAR(1000),
    "starRating" INTEGER NOT NULL,
    "comment" TEXT,
    "googleCreatedAt" TIMESTAMP(3) NOT NULL,
    "googleUpdatedAt" TIMESTAMP(3) NOT NULL,
    "sourcePayloadHash" VARCHAR(64) NOT NULL,
    "selectedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "selectedAt" TIMESTAMP(3),
    "selectedById" UUID,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" UUID NOT NULL,
    "connectionId" UUID NOT NULL,
    "status" "GoogleSyncStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" UUID NOT NULL,
    "fieldsRead" TEXT[],
    "differences" JSONB,
    "errorCode" VARCHAR(160),
    "errorMessage" VARCHAR(500),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" UUID NOT NULL,
    "enquiryId" UUID,
    "kind" "EmailOutboxKind" NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "dedupeKey" VARCHAR(200) NOT NULL,
    "fromAddress" VARCHAR(320) NOT NULL,
    "toAddress" VARCHAR(320) NOT NULL,
    "replyToAddress" VARCHAR(320),
    "subject" VARCHAR(255) NOT NULL,
    "textBody" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 8,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "providerMessageId" VARCHAR(200),
    "providerStatus" VARCHAR(80),
    "providerCheckedAt" TIMESTAMP(3),
    "lastErrorCode" VARCHAR(160),
    "lastError" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "name" VARCHAR(160),
    "imageUrl" VARCHAR(1000),
    "role" "AdminRole" NOT NULL DEFAULT 'STAFF',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" UUID NOT NULL,
    "sessionTokenHash" VARCHAR(64) NOT NULL,
    "adminUserId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entityType" VARCHAR(120) NOT NULL,
    "entityId" VARCHAR(180),
    "metadata" JSONB,
    "ipHash" VARCHAR(64),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_reference_key" ON "Enquiry"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_idempotencyHash_key" ON "Enquiry"("idempotencyHash");

-- CreateIndex
CREATE INDEX "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_status_createdAt_idx" ON "Enquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_type_createdAt_idx" ON "Enquiry"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_source_createdAt_idx" ON "Enquiry"("source", "createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_service_idx" ON "Enquiry"("service");

-- CreateIndex
CREATE INDEX "Enquiry_selectedBrand_idx" ON "Enquiry"("selectedBrand");

-- CreateIndex
CREATE INDEX "Enquiry_selectedDevice_idx" ON "Enquiry"("selectedDevice");

-- CreateIndex
CREATE INDEX "Enquiry_city_idx" ON "Enquiry"("city");

-- CreateIndex
CREATE UNIQUE INDEX "UploadSession_claimTokenHash_key" ON "UploadSession"("claimTokenHash");

-- CreateIndex
CREATE INDEX "UploadSession_status_expiresAt_idx" ON "UploadSession"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "UploadSession_enquiryId_idx" ON "UploadSession"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "EnquiryAttachment_storageKey_key" ON "EnquiryAttachment"("storageKey");

-- CreateIndex
CREATE INDEX "EnquiryAttachment_enquiryId_createdAt_idx" ON "EnquiryAttachment"("enquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "EnquiryAttachment_uploadSessionId_idx" ON "EnquiryAttachment"("uploadSessionId");

-- CreateIndex
CREATE INDEX "EnquiryAttachment_scanStatus_idx" ON "EnquiryAttachment"("scanStatus");

-- CreateIndex
CREATE INDEX "LeadNote_enquiryId_createdAt_idx" ON "LeadNote"("enquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "FollowUp_enquiryId_dueAt_idx" ON "FollowUp"("enquiryId", "dueAt");

-- CreateIndex
CREATE INDEX "FollowUp_assignedToId_status_dueAt_idx" ON "FollowUp"("assignedToId", "status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE INDEX "Brand_isPublished_sortOrder_idx" ON "Brand"("isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "HearingAid_status_isFeatured_sortOrder_idx" ON "HearingAid"("status", "isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "HearingAid_brandId_status_idx" ON "HearingAid"("brandId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HearingAid_brandId_slug_key" ON "HearingAid"("brandId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMedia_storageKey_key" ON "ProductMedia"("storageKey");

-- CreateIndex
CREATE INDEX "ProductMedia_hearingAidId_sortOrder_idx" ON "ProductMedia"("hearingAidId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_slug_key" ON "Offer"("slug");

-- CreateIndex
CREATE INDEX "Offer_enabled_startsAt_endsAt_idx" ON "Offer"("enabled", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- CreateIndex
CREATE INDEX "Service_status_sortOrder_idx" ON "Service"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_sourceSnapshotId_key" ON "BusinessProfile"("sourceSnapshotId");

-- CreateIndex
CREATE INDEX "GoogleConnection_status_idx" ON "GoogleConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleConnection_googleSubject_locationId_key" ON "GoogleConnection"("googleSubject", "locationId");

-- CreateIndex
CREATE INDEX "GoogleSnapshot_connectionId_capturedAt_idx" ON "GoogleSnapshot"("connectionId", "capturedAt");

-- CreateIndex
CREATE INDEX "GoogleSnapshot_approvalStatus_capturedAt_idx" ON "GoogleSnapshot"("approvalStatus", "capturedAt");

-- CreateIndex
CREATE INDEX "GoogleSnapshot_expiresAt_idx" ON "GoogleSnapshot"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleReview_googleReviewName_key" ON "GoogleReview"("googleReviewName");

-- CreateIndex
CREATE INDEX "GoogleReview_selectedByAdmin_expiresAt_idx" ON "GoogleReview"("selectedByAdmin", "expiresAt");

-- CreateIndex
CREATE INDEX "GoogleReview_expiresAt_idx" ON "GoogleReview"("expiresAt");

-- CreateIndex
CREATE INDEX "GoogleReview_googleUpdatedAt_idx" ON "GoogleReview"("googleUpdatedAt");

-- CreateIndex
CREATE INDEX "SyncRun_connectionId_createdAt_idx" ON "SyncRun"("connectionId", "createdAt");

-- CreateIndex
CREATE INDEX "SyncRun_status_createdAt_idx" ON "SyncRun"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOutbox_dedupeKey_key" ON "EmailOutbox"("dedupeKey");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_nextAttemptAt_idx" ON "EmailOutbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "EmailOutbox_enquiryId_idx" ON "EmailOutbox"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_sessionTokenHash_key" ON "AdminSession"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminUserId_expiresAt_idx" ON "AdminSession"("adminUserId", "expiresAt");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "EnquirySensitiveData" ADD CONSTRAINT "EnquirySensitiveData_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryAttachment" ADD CONSTRAINT "EnquiryAttachment_uploadSessionId_fkey" FOREIGN KEY ("uploadSessionId") REFERENCES "UploadSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryAttachment" ADD CONSTRAINT "EnquiryAttachment_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAid" ADD CONSTRAINT "HearingAid_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_hearingAidId_fkey" FOREIGN KEY ("hearingAidId") REFERENCES "HearingAid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferService" ADD CONSTRAINT "OfferService_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferService" ADD CONSTRAINT "OfferService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferBrand" ADD CONSTRAINT "OfferBrand_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferBrand" ADD CONSTRAINT "OfferBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferHearingAid" ADD CONSTRAINT "OfferHearingAid_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferHearingAid" ADD CONSTRAINT "OfferHearingAid_hearingAidId_fkey" FOREIGN KEY ("hearingAidId") REFERENCES "HearingAid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_sourceSnapshotId_fkey" FOREIGN KEY ("sourceSnapshotId") REFERENCES "GoogleSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleConnection" ADD CONSTRAINT "GoogleConnection_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleSnapshot" ADD CONSTRAINT "GoogleSnapshot_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GoogleConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleSnapshot" ADD CONSTRAINT "GoogleSnapshot_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "SyncRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleSnapshot" ADD CONSTRAINT "GoogleSnapshot_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleReview" ADD CONSTRAINT "GoogleReview_sourceSnapshotId_fkey" FOREIGN KEY ("sourceSnapshotId") REFERENCES "GoogleSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleReview" ADD CONSTRAINT "GoogleReview_selectedById_fkey" FOREIGN KEY ("selectedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GoogleConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business and Google-derived content cannot be published without an explicit approver.
ALTER TABLE "BusinessProfile"
  ADD CONSTRAINT "BusinessProfile_published_requires_approval"
  CHECK (NOT "isPublished" OR ("approvedAt" IS NOT NULL AND "approvedById" IS NOT NULL));

ALTER TABLE "GoogleSnapshot"
  ADD CONSTRAINT "GoogleSnapshot_approval_consistent"
  CHECK ("approvalStatus" <> 'APPROVED' OR ("approvedAt" IS NOT NULL AND "approvedById" IS NOT NULL));

-- Google API content remains a bounded cache and must be refreshed or removed within 30 days.
ALTER TABLE "GoogleSnapshot"
  ADD CONSTRAINT "GoogleSnapshot_ttl_max_30_days"
  CHECK ("expiresAt" > "capturedAt" AND "expiresAt" <= "capturedAt" + INTERVAL '30 days');

ALTER TABLE "GoogleReview"
  ADD CONSTRAINT "GoogleReview_ttl_max_30_days"
  CHECK ("expiresAt" > "fetchedAt" AND "expiresAt" <= "fetchedAt" + INTERVAL '30 days'),
  ADD CONSTRAINT "GoogleReview_star_rating_range"
  CHECK ("starRating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "GoogleReview_selection_consistent"
  CHECK (
    (NOT "selectedByAdmin" AND "selectedAt" IS NULL AND "selectedById" IS NULL)
    OR ("selectedByAdmin" AND "selectedAt" IS NOT NULL AND "selectedById" IS NOT NULL)
  );

ALTER TABLE "Offer"
  ADD CONSTRAINT "Offer_discount_range"
  CHECK ("maximumDiscountPct" IS NULL OR "maximumDiscountPct" BETWEEN 0 AND 100),
  ADD CONSTRAINT "Offer_date_order"
  CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "startsAt" < "endsAt");

ALTER TABLE "EnquiryAttachment"
  ADD CONSTRAINT "EnquiryAttachment_positive_size" CHECK ("sizeBytes" > 0);

ALTER TABLE "UploadSession"
  ADD CONSTRAINT "UploadSession_expiry_after_creation" CHECK ("expiresAt" > "createdAt");

-- Audit logs are append-only even if a future application bug attempts mutation or deletion.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditLog_append_only"
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
