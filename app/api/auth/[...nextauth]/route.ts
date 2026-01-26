import NextAuth from 'next-auth';
import { authOptions } from '@/lib/google-auth';

// Handle NextAuth initialization safely
let handler: any = null;

try {
  // Only initialize NextAuth if we have required environment variables
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.NEXTAUTH_SECRET) {
    handler = NextAuth(authOptions);
  } else {
    console.warn('NextAuth not initialized: Missing required environment variables');
    handler = async () => {
      return new Response('Authentication service not configured', { status: 503 });
    };
  }
} catch (error) {
  console.error('NextAuth initialization error:', error);
  // Fallback handler for when NextAuth fails to initialize
  handler = async () => {
    return new Response('Authentication service temporarily unavailable', { status: 503 });
  };
}

export { handler as GET, handler as POST };
