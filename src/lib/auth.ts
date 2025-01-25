import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma'; // Assuming your Prisma client is in this file
import bcrypt from 'bcryptjs';

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
        const { email, password } = credentials as { email: string; password: string };

        // Find the user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new Error('No user found with the email');
        }

        // Validate the password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login', // Redirect here for login
    error: '/login',  // Redirect here on error
  },
};