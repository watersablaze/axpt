import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (
          credentials?.username === "admin" &&
          credentials?.password === "password"
        ) {
          return {
            id: "1",
            name: "Admin User",
            isAdmin: true, // ✅ Required custom field
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
  },
};