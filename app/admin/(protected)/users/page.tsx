import { AdminRole } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/auth";
import { getPrisma } from "@/lib/db";
import {
  addAdminUserAction,
  changeAdminUserActiveStateAction,
  changeAdminUserRoleAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const notices: Record<string, { tone: "success" | "error"; message: string }> = {
  user_added: { tone: "success", message: "The exact email was added to the admin allowlist." },
  role_updated: { tone: "success", message: "The admin role was updated." },
  status_updated: { tone: "success", message: "The admin account status was updated." },
  email_exists: { tone: "error", message: "That exact email already has an admin record." },
  user_not_found: { tone: "error", message: "The selected admin account no longer exists." },
  no_change: { tone: "error", message: "Choose a value that changes the current account." },
  owner_required: { tone: "error", message: "Only an active Owner can manage admin users." },
  last_active_owner: {
    tone: "error",
    message: "The final active Owner cannot be deactivated or assigned a lower role.",
  },
  self_deactivation: {
    tone: "error",
    message: "You cannot deactivate the account used by your current session.",
  },
  invalid_input: { tone: "error", message: "Check the exact email, role, and account status." },
  change_failed: { tone: "error", message: "The change could not be completed safely." },
};

function noticeValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.slice(0, 80) : "";
}

function formatDate(value: Date | null): string {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  const params = await searchParams;
  const notice = notices[noticeValue(params.notice)];
  const users = await getPrisma().adminUser.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  const activeOwnerCount = users.filter(
    (user) => user.active && user.role === AdminRole.OWNER,
  ).length;

  return (
    <section>
      <div className="mb-6 max-w-4xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sky-300">
          Owner controls
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Admin users</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Add one exact Google-account email at a time. Google must report that email as verified,
          and inactive accounts cannot sign in. Every role and status change is written to the audit
          log.
        </p>
      </div>

      {notice ? (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`mb-6 rounded-2xl border p-4 text-sm ${
            notice.tone === "error"
              ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <form
        action={addAdminUserAction}
        className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5 lg:grid-cols-[minmax(16rem,1fr)_12rem_11rem_auto] lg:items-end"
      >
        <label className="grid gap-2 text-sm font-semibold text-slate-200">
          Exact Google email
          <input
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="off"
            placeholder="person@example.com"
            className="min-h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-white placeholder:text-slate-600"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-200">
          Role
          <select
            name="role"
            defaultValue={AdminRole.STAFF}
            className="min-h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-white"
          >
            {Object.values(AdminRole).map((role) => (
              <option key={role} value={role}>
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-200">
          Initial status
          <select
            name="active"
            defaultValue="true"
            className="min-h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-white"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-xl bg-sky-600 px-5 text-sm font-bold text-white hover:bg-sky-500">
          Add exact email
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <p>{users.length} admin account{users.length === 1 ? "" : "s"}</p>
        <p>{activeOwnerCount} active Owner{activeOwnerCount === 1 ? "" : "s"}</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-800 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="p-4">Account</th>
              <th className="p-4">Status</th>
              <th className="p-4">Last sign-in</th>
              <th className="p-4">Role</th>
              <th className="p-4">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => {
              const isCurrentUser = user.id === admin.id;
              const isLastActiveOwner =
                user.active && user.role === AdminRole.OWNER && activeOwnerCount === 1;

              return (
                <tr key={user.id} className="align-top">
                  <td className="p-4">
                    <p className="font-bold text-white">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {user.name || "Name available after verified sign-in"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">Added {formatDate(user.createdAt)}</p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        user.active
                          ? "bg-emerald-400/15 text-emerald-200"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {user.active ? "Active" : "Inactive"}
                    </span>
                    <p className="mt-2 text-xs text-slate-500">
                      {user.emailVerifiedAt ? "Google email verified" : "Awaiting verified sign-in"}
                    </p>
                    {isCurrentUser ? <p className="mt-1 text-xs text-sky-300">Current session</p> : null}
                    {isLastActiveOwner ? <p className="mt-1 text-xs text-amber-300">Last active Owner</p> : null}
                  </td>
                  <td className="whitespace-nowrap p-4 text-slate-300">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="p-4">
                    <form action={changeAdminUserRoleAction} className="flex min-w-56 gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        aria-label={`Role for ${user.email}`}
                        className="min-h-10 flex-1 rounded-lg border border-white/10 bg-slate-950 px-2 text-white"
                      >
                        {Object.values(AdminRole).map((role) => (
                          <option key={role} value={role}>
                            {role.charAt(0) + role.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg border border-white/15 px-3 font-bold text-slate-200 hover:bg-white/5"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="p-4">
                    <form action={changeAdminUserActiveStateAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="active" value={user.active ? "false" : "true"} />
                      <button
                        type="submit"
                        disabled={isCurrentUser && user.active}
                        className="min-h-10 rounded-lg border border-white/15 px-3 font-bold text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {user.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
