import { AdminRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: AdminRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    adminSessionId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    adminId?: string;
    adminRole?: AdminRole;
    adminSessionId?: string;
  }
}
