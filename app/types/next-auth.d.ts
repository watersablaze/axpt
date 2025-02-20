import NextAuth, { DefaultSession, DefaultUser, DefaultJWT } from "next-auth";

// ✅ Extend User type
declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    isAdmin: boolean; // ✅ Ensures isAdmin is always present
    walletAddress?: string; // ✅ Optional
    avatar?: string;
  }

  interface Session extends DefaultSession {
    user: User; // ✅ Ensures `user` structure matches the extended User type
  }

  interface JWT extends DefaultJWT {
    id: string;
    isAdmin: boolean;
    walletAddress?: string;
    avatar?: string;
  }
}