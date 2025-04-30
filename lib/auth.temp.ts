import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

// ✅ Extend NextAuth's User type to include `image`, `walletAddress`, and `isAdmin`
interface CustomUser extends User {
  image?: string;
  walletAddress?: string;
  isAdmin: boolean;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("🟡 Checking credentials:", credentials);

        if (!credentials?.email || !credentials?.password) {
          console.error("❌ Missing email or password.");
          throw new Error('Missing email or password');
        }

        // ✅ Fetch user from the database (including `avatar` & `isAdmin`)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            walletAddress: true,
            isAdmin: true,
            password: true,
          },
        });

        console.log("🔍 Prisma Query Result for User:", user);

        if (!user) {
          console.error("❌ No user found with this email:", credentials.email);
          throw new Error('No user found');
        }

        // ✅ Validate password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        console.log("🔑 Password match:", isValid);

        if (!isValid) {
          console.error("❌ Invalid password for:", credentials.email);
          throw new Error('Invalid password');
        }

        // ✅ Ensure all required properties exist
        const authUser: CustomUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || "/default-user.png", // ✅ Default avatar
          walletAddress: user.walletAddress || undefined,
          isAdmin: user.isAdmin, // ✅ Include isAdmin
        };

        console.log("✅ Authorized User:", authUser);
        return authUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("🟢 Storing User Data in JWT:", user);
        token.avatar = (user as CustomUser).avatar;
        token.walletAddress = (user as CustomUser).walletAddress || undefined;
        token.isAdmin = (user as CustomUser).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        console.log("🟢 Storing JWT Data in Session:", token);
        session.user.avatar = token.avatar as string;
        session.user.walletAddress = token.walletAddress as string | undefined;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};