import NextAuth from "next-auth";

const ENV = process.env.NEXT_PUBLIC_ENV;

const authOptions = ENV === "prod"
  ? (await import("@/lib/auth.prod")).authOptions
  : (await import("@/lib/auth.dev")).authOptions;

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };