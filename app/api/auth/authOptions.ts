import { NextAuthOptions } from "next-auth"; // ✅ Import NextAuthOptions
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma"; // ✅ Import Prisma instance
import bcrypt from "bcryptjs";

// ✅ Define `authOptions` correctly
const authOptions: NextAuthOptions = {
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
          select: { id: true, name: true, email: true, password: true, isAdmin: true },
        });

        if (!user || !user.password) {
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
          isAdmin: Boolean(user.isAdmin),
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = String(user.id);
        token.isAdmin = Boolean(user.isAdmin);
      }
      return token;
    },
  },
};

// ✅ Correctly export `authOptions`
export default authOptions;