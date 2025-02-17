import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ✅ Prevent multiple PrismaClient instances in development
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "example@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No user found");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin, // ✅ Ensure this exists in your database schema
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET, // ✅ Ensure this is set in your .env.local file
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login", // ✅ Custom login page
    error: "/login", // ✅ Redirect to login on error
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin; // ✅ Attach isAdmin to session
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin; // ✅ Attach isAdmin to JWT token
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };