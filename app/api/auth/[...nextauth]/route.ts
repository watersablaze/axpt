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
        console.log("🟡 Checking credentials:", credentials);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password");
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            isAdmin: true, // ✅ Explicitly select isAdmin
            password: true, // ✅ Needed for bcrypt comparison
          },
        });

        console.log("🔍 Prisma Query Result for User:", user); // ✅ Debugging Log

        if (!user) {
          console.log("❌ No user found with email:", credentials.email);
          throw new Error("No user found");
        }

        console.log("✅ User found:", user);

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        console.log("🔑 Password match:", isValidPassword);

        if (!isValidPassword) {
          console.log("❌ Invalid password for:", credentials.email);
          throw new Error("Invalid credentials");
        }

        console.log("✅ Login successful:", user.email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: Boolean(user.isAdmin), // ✅ Ensure it's always a boolean
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
        session.user.id = String(token.id); // ✅ Convert unknown to string
        session.user.isAdmin = Boolean(token.isAdmin); // ✅ Convert unknown to boolean
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin; // ✅ Attach isAdmin to JWT token
      }
      console.log("🟢 JWT Token Data:", token); // ✅ Debugging Log
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };