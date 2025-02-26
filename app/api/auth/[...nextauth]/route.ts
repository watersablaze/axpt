import NextAuth from "next-auth";
import authOptions from "@/app/api/auth/authOptions"; // ✅ Correctly import `authOptions`

// ✅ Create NextAuth handler
const handler = NextAuth(authOptions);

// ✅ Export handler correctly
export { handler as GET, handler as POST };