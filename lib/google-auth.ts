import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Add admin email check here if needed
      // const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
      // return adminEmails.includes(user.email || '');
      return true; // Allow all Google sign-ins for now
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
};
