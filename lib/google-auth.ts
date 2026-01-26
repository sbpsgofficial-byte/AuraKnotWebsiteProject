import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow specific email to sign in
      const allowedEmail = process.env.ALLOWED_EMAIL || process.env.ADMIN_EMAIL;
      if (!allowedEmail) {
        console.warn('ALLOWED_EMAIL environment variable not set');
        return false;
      }
      return user.email === allowedEmail;
    },
    async session({ session, token }) {
      if (session.user) {
        // Add role to session
        (session.user as any).role = 'admin';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
  // Only set baseUrl if NEXTAUTH_URL is properly configured and is a valid URL
  ...(process.env.NEXTAUTH_URL &&
      typeof process.env.NEXTAUTH_URL === 'string' &&
      process.env.NEXTAUTH_URL.trim().length > 0 &&
      process.env.NEXTAUTH_URL.startsWith('http') &&
      (() => {
        try {
          new URL(process.env.NEXTAUTH_URL!);
          return true;
        } catch {
          return false;
        }
      })()
    ? {
        baseUrl: process.env.NEXTAUTH_URL,
      }
    : {}),
};
