import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthConfigured, signIn } from "@/auth";
import { getCurrentAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin Sign In | Audiosen",
  robots: { index: false, follow: false },
};

export default async function AdminSignInPage() {
  const currentAdmin = await getCurrentAdmin().catch(() => null);
  if (currentAdmin) redirect("/admin/enquiries");
  const configured = isAdminAuthConfigured();

  return (
    <main className="mx-auto min-h-[70vh] max-w-xl px-5 py-20">
      <section className="premium-shell p-7 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Restricted area</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-slate-950">Audiosen Admin</h1>
        <p className="mt-4 leading-7 text-slate-600">
          Sign in with a verified Google email that is either in the deployment bootstrap
          allowlist or was explicitly added by an active Owner. There is no password or development
          bypass.
        </p>
        {configured ? (
          <form
            className="mt-8"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/admin/enquiries" });
            }}
          >
            <button className="premium-button-primary w-full" type="submit">
              Continue with Google
            </button>
          </form>
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            Admin access is unavailable until DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID,
            AUTH_GOOGLE_SECRET, ADMIN_EMAIL_ALLOWLIST, and a matching ADMIN_OWNER_EMAIL are
            configured securely.
          </div>
        )}
      </section>
    </main>
  );
}
