import { AdminRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth, isAdminAuthConfigured } from "@/auth";
import { getPrisma } from "@/lib/db";
import { sha256 } from "@/lib/enquiries/security";

export type AuthorizedAdmin = {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  sessionId: string;
};

export async function getCurrentAdmin(
  allowedRoles: AdminRole[] = [AdminRole.OWNER, AdminRole.ADMIN, AdminRole.STAFF],
): Promise<AuthorizedAdmin | null> {
  if (!isAdminAuthConfigured()) return null;
  const session = await auth();
  if (!session?.user?.email || !session.adminSessionId) return null;

  const sessionTokenHash = sha256(session.adminSessionId);
  const current = await getPrisma().adminSession.findUnique({
    where: { sessionTokenHash },
    include: { adminUser: true },
  });
  if (
    !current ||
    current.revokedAt ||
    current.expiresAt <= new Date() ||
    !current.adminUser.active ||
    current.adminUser.email !== session.user.email.toLowerCase() ||
    !allowedRoles.includes(current.adminUser.role)
  ) {
    return null;
  }

  if (current.lastSeenAt < new Date(Date.now() - 15 * 60_000)) {
    void getPrisma().adminSession.update({
      where: { id: current.id },
      data: { lastSeenAt: new Date() },
    });
  }

  return {
    id: current.adminUser.id,
    email: current.adminUser.email,
    name: current.adminUser.name,
    role: current.adminUser.role,
    sessionId: current.id,
  };
}

export async function requireAdmin(
  allowedRoles: AdminRole[] = [AdminRole.OWNER, AdminRole.ADMIN, AdminRole.STAFF],
): Promise<AuthorizedAdmin> {
  if (!isAdminAuthConfigured()) redirect("/admin/sign-in?reason=configuration");
  const current = await getCurrentAdmin(allowedRoles);
  if (!current) redirect("/admin/sign-in?reason=unauthorized");
  return current;
}

export async function revokeCurrentAdminSession(): Promise<void> {
  const session = await auth();
  if (!session?.adminSessionId || !process.env.DATABASE_URL) return;
  await getPrisma().adminSession.updateMany({
    where: { sessionTokenHash: sha256(session.adminSessionId), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
