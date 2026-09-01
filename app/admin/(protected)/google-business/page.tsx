import {
  AdminRole,
  GoogleConnectionStatus,
  GoogleSnapshotApprovalStatus,
} from "@prisma/client";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getPrisma } from "@/lib/db";
import {
  discoverGoogleAccounts,
  discoverGoogleLocations,
} from "@/lib/google-business/operations";
import { isGoogleBusinessOAuthConfigured } from "@/lib/google-business/oauth";
import type {
  GoogleBusinessAccount,
  GoogleBusinessLocation,
} from "@/lib/google-business/types";
import {
  approveGoogleSnapshotAction,
  chooseGoogleAccountAction,
  chooseGoogleLocationAction,
  rejectGoogleSnapshotAction,
  stageGoogleSnapshotAction,
  toggleGoogleReviewAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type StoredFieldDiff = {
  field: "phone" | "address" | "hours";
  websiteValue: unknown;
  googleValue: unknown;
  state: "same" | "different" | "google_blank" | "website_blank";
  canApprove: boolean;
};

const noticeText: Record<string, string> = {
  connected: "Google Business authorization is connected. Select the exact account and location.",
  account_selected: "Google Business account selected.",
  location_selected: "Google Business location selected. You may now stage a read-only snapshot.",
  snapshot_staged: "A read-only snapshot was staged. Review every difference before approval.",
  snapshot_approved: "Selected fields were approved and the public profile cache was updated.",
  snapshot_rejected: "The staged snapshot was rejected without changing public data.",
  review_selection_updated: "Review selection updated without editing the Google review text.",
  authorization_rejected: "Google authorization was cancelled or its security state was invalid.",
  business_scope_missing: "Google did not grant the required Business Profile scope.",
  refresh_token_missing: "Google did not return an offline refresh token. Revoke the old grant and reconnect.",
  authorization_failed: "Google authorization could not be completed.",
  account_selection_failed: "The account selection could not be verified with Google.",
  location_selection_failed: "The location selection could not be verified with Google.",
  sync_failed: "The read-only Google sync failed. Check API approval, quota, and authorization.",
  approval_failed: "Nothing was published. Confirm that every selected Google field is complete and current.",
  rejection_failed: "The snapshot could not be rejected.",
  review_selection_failed: "Only a current review from an approved snapshot can be selected.",
};

function storedDiffs(value: unknown): StoredFieldDiff[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const fields = (value as { fields?: unknown }).fields;
  if (!Array.isArray(fields)) return [];
  return fields.filter(
    (entry): entry is StoredFieldDiff =>
      Boolean(
        entry &&
          typeof entry === "object" &&
          ["phone", "address", "hours"].includes(
            String((entry as StoredFieldDiff).field),
          ),
      ),
  );
}

function locationPayload(value: unknown): GoogleBusinessLocation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const location = value as GoogleBusinessLocation;
  return /^locations\/[A-Za-z0-9_-]+$/.test(location.name || "") ? location : null;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not approved / blank";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => formatValue(item)).join(" · ") : "Not approved / blank";
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== null && child !== undefined && child !== "")
      .map(([key, child]) => `${key}: ${formatValue(child)}`)
      .join(" · ") || "Not approved / blank";
  }
  return "Not approved / blank";
}

function dateTime(value: Date | null | undefined): string {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function stars(count: number): string {
  return "★".repeat(Math.max(0, Math.min(5, count)));
}

export default async function GoogleBusinessAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const admin = await requireAdmin([AdminRole.OWNER, AdminRole.ADMIN]);
  const params = await searchParams;
  const noticeKey = typeof params.notice === "string" ? params.notice : "";
  const prisma = getPrisma();
  const [connections, profile, snapshots, reviews, syncRuns] = await Promise.all([
    prisma.googleConnection.findMany({ orderBy: { updatedAt: "desc" }, take: 10 }),
    prisma.businessProfile.findUnique({ where: { id: "primary" } }),
    prisma.googleSnapshot.findMany({
      orderBy: { capturedAt: "desc" },
      take: 10,
      include: { approvedBy: { select: { email: true } } },
    }),
    prisma.googleReview.findMany({
      orderBy: { googleUpdatedAt: "desc" },
      take: 50,
      include: { sourceSnapshot: { select: { approvalStatus: true } } },
    }),
    prisma.syncRun.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const activeConnection = connections.find(
    (connection) => connection.status === GoogleConnectionStatus.ACTIVE,
  );

  let accounts: GoogleBusinessAccount[] = [];
  let locations: GoogleBusinessLocation[] = [];
  let discoveryUnavailable = false;
  if (admin.role === AdminRole.OWNER && activeConnection && !activeConnection.locationId) {
    try {
      if (!activeConnection.accountId) {
        accounts = await discoverGoogleAccounts(activeConnection.id);
      } else {
        locations = await discoverGoogleLocations(activeConnection.id, activeConnection.accountId);
      }
    } catch {
      discoveryUnavailable = true;
    }
  }

  const latestSnapshot = snapshots[0];
  const latestLocation = latestSnapshot ? locationPayload(latestSnapshot.payload) : null;
  const differences = latestSnapshot ? storedDiffs(latestSnapshot.differences) : [];
  const phoneDiff = differences.find((entry) => entry.field === "phone");
  const addressDiff = differences.find((entry) => entry.field === "address");
  const hoursDiff = differences.find((entry) => entry.field === "hours");
  const hasReviewUri = Boolean(latestLocation?.metadata?.newReviewUri);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Owner-reviewed data</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Google Business Profile</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            V1 reads Google data and stages differences. It never writes to Google, and blank Google
            fields never replace approved website data.
          </p>
        </div>
        {admin.role === AdminRole.OWNER && isGoogleBusinessOAuthConfigured() ? (
          <Link
            href="/api/admin/google-business/connect"
            className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white hover:bg-sky-500"
          >
            {activeConnection ? "Reauthorize owner access" : "Connect Google Business"}
          </Link>
        ) : null}
      </div>

      {noticeText[noticeKey] ? (
        <div role="status" className="rounded-2xl border border-sky-400/30 bg-sky-400/10 p-4 text-sm text-sky-100">
          {noticeText[noticeKey]}
        </div>
      ) : null}

      {!isGoogleBusinessOAuthConfigured() ? (
        <div role="alert" className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100">
          Owner OAuth is not configured. Keep address, hours, Maps, and reviews hidden until the API,
          callback, and Key Vault settings in the deployment runbook are complete.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Connection</p>
          <p className="mt-3 font-semibold text-white">{activeConnection?.status || "Not connected"}</p>
          <p className="mt-2 break-all text-sm text-slate-400">
            Account: {activeConnection?.accountId || "Not selected"}
          </p>
          <p className="mt-1 break-all text-sm text-slate-400">
            Location: {activeConnection?.locationId || "Not selected"}
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved website profile</p>
          <p className="mt-3 font-semibold text-white">{profile?.isPublished ? "Published cache" : "Hidden"}</p>
          <p className="mt-2 text-sm text-slate-400">Phone: {profile?.phone || "8923092563"}</p>
          <p className="mt-1 text-sm text-slate-400">Approved: {dateTime(profile?.approvedAt)}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Last read</p>
          <p className="mt-3 font-semibold text-white">{dateTime(latestSnapshot?.capturedAt)}</p>
          <p className="mt-2 text-sm text-slate-400">
            Status: {latestSnapshot?.approvalStatus || "No snapshot"}
          </p>
          <p className="mt-1 text-sm text-slate-400">Expires: {dateTime(latestSnapshot?.expiresAt)}</p>
        </article>
      </div>

      {discoveryUnavailable ? (
        <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
          Google account discovery is unavailable. Check API approval, quota, and owner authorization.
        </div>
      ) : null}

      {admin.role === AdminRole.OWNER && activeConnection && accounts.length ? (
        <form action={chooseGoogleAccountAction} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <input type="hidden" name="connectionId" value={activeConnection.id} />
          <label htmlFor="accountName" className="font-bold text-white">Select the exact Google account</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select id="accountName" name="accountName" required className="min-h-11 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 text-white">
              <option value="">Choose an account returned by Google</option>
              {accounts.map((account) => (
                <option key={account.name} value={account.name}>
                  {account.accountName || account.name} · {account.verificationState || "state unavailable"}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-sky-600 px-4 py-3 font-bold text-white" type="submit">Verify account</button>
          </div>
        </form>
      ) : null}

      {admin.role === AdminRole.OWNER && activeConnection?.accountId && !activeConnection.locationId && locations.length ? (
        <form action={chooseGoogleLocationAction} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <input type="hidden" name="connectionId" value={activeConnection.id} />
          <label htmlFor="locationName" className="font-bold text-white">Select the exact Google location</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select id="locationName" name="locationName" required className="min-h-11 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 text-white">
              <option value="">Choose a location returned by Google</option>
              {locations.map((location) => (
                <option key={location.name} value={location.name}>
                  {location.title || location.name} · {formatValue(location.storefrontAddress)}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-sky-600 px-4 py-3 font-bold text-white" type="submit">Verify location</button>
          </div>
        </form>
      ) : null}

      {admin.role === AdminRole.OWNER && activeConnection?.locationId ? (
        <form action={stageGoogleSnapshotAction} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <input type="hidden" name="connectionId" value={activeConnection.id} />
          <h2 className="text-xl font-bold text-white">Read and stage current Google data</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            This reads phone, address, hours, profile links, and genuine reviews. It does not update either Google or the public website.
          </p>
          <button className="mt-4 rounded-xl border border-sky-400/50 px-4 py-3 font-bold text-sky-200" type="submit">
            Stage read-only preview
          </button>
        </form>
      ) : null}

      {latestSnapshot && latestLocation ? (
        <article className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Review differences</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{latestLocation.title || latestLocation.name}</h2>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200">
              {latestSnapshot.approvalStatus}
            </span>
          </div>

          {phoneDiff?.state === "different" ? (
            <div role="alert" className="mt-5 rounded-xl border border-rose-400/40 bg-rose-400/10 p-4 text-sm text-rose-100">
              Phone mismatch: the website remains locked to 8923092563. Google returned {formatValue(phoneDiff.googleValue)}.
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="p-3">Field</th><th className="p-3">Website</th><th className="p-3">Google snapshot</th><th className="p-3">State</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {differences.map((difference) => (
                  <tr key={difference.field} className="align-top">
                    <th className="p-3 capitalize text-white">{difference.field}</th>
                    <td className="max-w-sm p-3 text-slate-400">{formatValue(difference.websiteValue)}</td>
                    <td className="max-w-sm p-3 text-slate-300">{formatValue(difference.googleValue)}</td>
                    <td className="p-3 text-slate-400">{difference.state.replaceAll("_", " ")}</td>
                  </tr>
                ))}
                <tr className="align-top">
                  <th className="p-3 text-white">Review URI</th>
                  <td className="p-3 text-slate-400">{profile?.googleReviewUri || "Not approved / blank"}</td>
                  <td className="max-w-sm break-all p-3 text-slate-300">{latestLocation.metadata?.newReviewUri || "Google did not return one"}</td>
                  <td className="p-3 text-slate-400">{hasReviewUri ? "available for approval" : "google blank"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {admin.role === AdminRole.OWNER && latestSnapshot.approvalStatus === GoogleSnapshotApprovalStatus.STAGED ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
              <form action={approveGoogleSnapshotAction} className="rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-4">
                <input type="hidden" name="snapshotId" value={latestSnapshot.id} />
                <fieldset>
                  <legend className="font-bold text-white">Approve only the checked fields</legend>
                  <div className="mt-3 flex flex-wrap gap-5 text-sm text-slate-200">
                    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="fields" value="address" disabled={!addressDiff?.canApprove} /> Address and Maps URI</label>
                    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="fields" value="hours" disabled={!hoursDiff?.canApprove} /> Opening hours</label>
                    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="fields" value="reviewLinks" disabled={!hasReviewUri} /> Review URI</label>
                  </div>
                  <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-amber-100">
                    <input type="checkbox" name="confirm" value="approve" required /> I reviewed each selected value and authorize its public use.
                  </label>
                </fieldset>
                <button type="submit" className="mt-3 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white">Approve selected fields</button>
              </form>
              <form action={rejectGoogleSnapshotAction} className="self-end">
                <input type="hidden" name="snapshotId" value={latestSnapshot.id} />
                <button type="submit" className="rounded-xl border border-rose-400/40 px-4 py-3 font-bold text-rose-200">Reject snapshot</button>
              </form>
            </div>
          ) : null}
        </article>
      ) : null}

      <article className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6">
        <h2 className="text-2xl font-bold text-white">Genuine cached reviews</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Admins may select an unexpired review from an approved snapshot. Reviewer text and rating cannot be edited here.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {reviews.map((review) => {
            const selectable =
              review.expiresAt > new Date() &&
              review.sourceSnapshot?.approvalStatus === GoogleSnapshotApprovalStatus.APPROVED;
            return (
              <section key={review.id} className="rounded-xl border border-white/10 bg-slate-950 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{review.reviewerDisplayName}</p>
                    <p aria-label={`${review.starRating} out of 5 stars`} className="mt-1 text-amber-300">{stars(review.starRating)}</p>
                  </div>
                  <span className="text-xs text-slate-500">Expires {dateTime(review.expiresAt)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{review.comment || "No written comment."}</p>
                <form action={toggleGoogleReviewAction} className="mt-4">
                  <input type="hidden" name="reviewId" value={review.id} />
                  <input type="hidden" name="selected" value={review.selectedByAdmin ? "false" : "true"} />
                  <button disabled={!selectable && !review.selectedByAdmin} className="rounded-lg border border-white/15 px-3 py-2 text-sm font-bold text-sky-200 disabled:cursor-not-allowed disabled:opacity-40" type="submit">
                    {review.selectedByAdmin ? "Remove from public site" : "Select for public site"}
                  </button>
                </form>
              </section>
            );
          })}
          {!reviews.length ? <p className="text-sm text-slate-400">No reviews are cached. Run a read-only sync after the verified location is selected.</p> : null}
        </div>
      </article>

      <article className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <h2 className="text-xl font-bold text-white">Recent sync runs</h2>
        <ul className="mt-4 divide-y divide-white/5 text-sm">
          {syncRuns.map((run) => (
            <li key={run.id} className="flex flex-wrap justify-between gap-3 py-3">
              <span className="font-semibold text-slate-200">{run.status}</span>
              <span className="text-slate-400">{dateTime(run.createdAt)}</span>
            </li>
          ))}
          {!syncRuns.length ? <li className="py-3 text-slate-400">No sync has run.</li> : null}
        </ul>
      </article>
    </section>
  );
}
