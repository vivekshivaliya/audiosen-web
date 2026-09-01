import type { Metadata } from "next";
import { AdminRole } from "@prisma/client";
import Link from "next/link";
import { signOut } from "@/auth";
import { requireAdmin, revokeCurrentAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-7">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900 px-5 py-4">
          <div>
            <Link href="/admin/enquiries" className="text-lg font-bold text-white">Audiosen Admin</Link>
            <p className="text-xs text-slate-400">{admin.email} · {admin.role.toLowerCase()}</p>
          </div>
          <nav className="flex items-center gap-3 text-sm font-semibold">
            <Link className="rounded-lg px-3 py-2 text-sky-300 hover:bg-white/5" href="/admin/enquiries">
              Enquiries
            </Link>
            {admin.role !== AdminRole.STAFF ? (
              <Link className="rounded-lg px-3 py-2 text-sky-300 hover:bg-white/5" href="/admin/google-business">
                Google Business
              </Link>
            ) : null}
            {admin.role !== AdminRole.STAFF ? (
              <Link className="rounded-lg px-3 py-2 text-sky-300 hover:bg-white/5" href="/admin/catalog">
                Catalog
              </Link>
            ) : null}
            {admin.role !== AdminRole.STAFF ? (
              <Link className="rounded-lg px-3 py-2 text-sky-300 hover:bg-white/5" href="/admin/offers">
                Offers
              </Link>
            ) : null}
            {admin.role === AdminRole.OWNER ? (
              <Link className="rounded-lg px-3 py-2 text-sky-300 hover:bg-white/5" href="/admin/users">
                Users
              </Link>
            ) : null}
            <form
              action={async () => {
                "use server";
                await revokeCurrentAdminSession();
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="rounded-lg border border-white/15 px-3 py-2 hover:bg-white/5">
                Sign out
              </button>
            </form>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
