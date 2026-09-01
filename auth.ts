import { randomBytes } from "node:crypto";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { AdminRole } from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { sha256 } from "@/lib/enquiries/security";

const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

function configuredAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAIL_ALLOWLIST || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function configuredOwnerEmail(): string | null {
  const email = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && configuredAdminEmails().has(email.trim().toLowerCase()));
}

export function isAdminAuthConfigured(): boolean {
  const allowlist = configuredAdminEmails();
  const ownerEmail = configuredOwnerEmail();
  return Boolean(
    process.env.AUTH_SECRET?.trim() &&
      process.env.AUTH_GOOGLE_ID?.trim() &&
      process.env.AUTH_GOOGLE_SECRET?.trim() &&
      allowlist.size > 0 &&
      ownerEmail &&
      allowlist.has(ownerEmail) &&
      isDatabaseConfigured(),
  );
}

function initialRole(email: string): AdminRole {
  return configuredOwnerEmail() === email.toLowerCase()
    ? AdminRole.OWNER
    : AdminRole.STAFF;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/admin/sign-in" },
  session: { strategy: "jwt", maxAge: ADMIN_SESSION_SECONDS },
  callbacks: {
    async signIn({ account, profile, user }) {
      const verifiedProfile = profile as
        | { email?: string; email_verified?: boolean }
        | undefined;
      const email = user.email?.trim().toLowerCase() ?? "";
      const verifiedEmail = verifiedProfile?.email?.trim().toLowerCase() ?? "";
      if (
        !isAdminAuthConfigured() ||
        account?.provider !== "google" ||
        verifiedProfile?.email_verified !== true ||
        !email ||
        verifiedEmail !== email
      ) {
        return false;
      }

      const existing = await getPrisma().adminUser.findUnique({
        where: { email },
        select: { active: true },
      });
      if (existing && !existing.active) return false;
      if (!existing && !isAllowedAdminEmail(email)) return false;

      const admin = await getPrisma().adminUser.upsert({
        where: { email },
        create: {
          email,
          name: user.name,
          imageUrl: user.image,
          role: initialRole(email),
          active: true,
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date(),
        },
        update: {
          name: user.name,
          imageUrl: user.image,
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
      return admin.active;
    },
    async jwt({ token, user }) {
      if (user?.email && isDatabaseConfigured()) {
        const admin = await getPrisma().adminUser.findUnique({
          where: { email: user.email.trim().toLowerCase() },
          select: { id: true, role: true, active: true },
        });
        if (admin?.active) {
          const sessionHandle = randomBytes(32).toString("base64url");
          await getPrisma().adminSession.create({
            data: {
              sessionTokenHash: sha256(sessionHandle),
              adminUserId: admin.id,
              expiresAt: new Date(Date.now() + ADMIN_SESSION_SECONDS * 1000),
            },
          });
          token.adminId = admin.id;
          token.adminRole = admin.role;
          token.adminSessionId = sessionHandle;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.adminId === "string" ? token.adminId : "";
        session.user.role = token.adminRole as AdminRole | undefined;
      }
      session.adminSessionId =
        typeof token.adminSessionId === "string" ? token.adminSessionId : undefined;
      return session;
    },
  },
});
