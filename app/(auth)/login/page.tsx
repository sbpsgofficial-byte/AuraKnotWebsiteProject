import { default as dynamicImport } from 'next/dynamic';

// Dynamically import the login component to prevent SSR issues
const LoginPageClient = dynamicImport(() => import('./LoginPageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Aura Knot Photography</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  ),
});

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginPageClient />;
}
