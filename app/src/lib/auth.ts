// 🔁 CLEAN AUTH CONFIG — aligned with current schema

import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// ✅ Extend NextAuth User Type
declare module "next-auth" {
  interface User {
    id: string;
    isAdmin: boolean;
    walletAddress?: string;
  }

  interface Session extends DefaultSession {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    walletAddress?: string;
    jti?: string;
  }
}

// ✅ NextAuth Configuration
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "example@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("❌ Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            isAdmin: true,
            walletAddress: true,
          },
        });

        if (!user) throw new Error("❌ No user found");

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) throw new Error("❌ Invalid credentials");

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin ?? false,
          walletAddress: user.walletAddress ?? undefined, // ✅ Convert null to undefined
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 60,
    updateAge: 10 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.walletAddress = user.walletAddress;
        token.jti = randomUUID();
      }

      const revokedToken = await prisma.revokedToken.findUnique({
        where: { jti: token.jti },
      });

      if (revokedToken) {
        throw new Error("❌ Token is revoked. Please log in again.");
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.walletAddress = token.walletAddress;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  },
};

export default NextAuth(authOptions);