import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      walletAddress?: string; // ✅ Add walletAddress to Session User
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    walletAddress?: string; // ✅ Add walletAddress to User
  }
}