import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean; // ✅ Ensures isAdmin is always present
    walletAddress?: string; // ✅ Optional wallet address
  }

  interface Session {
    user: User; // ✅ Now references the correct structure
  }

  interface JWT {
    id: string;
    isAdmin: boolean;
    walletAddress?: string; // ✅ Keep it consistent across session & JWT
  }
}