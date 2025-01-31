import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

// ✅ Extend NextAuth's User type to include `image`
interface CustomUser extends User {
  image?: string;
  walletAddress?: string;
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password');
        }

        // Fetch user from database (including `image`)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { id: true, name: true, email: true, walletAddress: true, password: true },
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        // Validate password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }

        // ✅ Ensure image exists or provide a default
        const authUser: CustomUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          walletAddress: user.walletAddress || undefined, 
        };

        return authUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.walletAddress = (user as CustomUser).walletAddress || undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.walletAddress = token.walletAddress as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};