import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../lib/api';

const AuthCallback: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return; // prevent double-run in StrictMode
    hasRunRef.current = true;
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const provider = urlParams.get('provider');

    if (!code || !state || !provider) {
      setError('Required authentication parameters are missing.');
      setLoading(false);
      return;
    }

    const exchangeToken = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authApi.exchangeToken(code, state, provider);

        if (response.success) {
          // Store token (unified approach: token may be at root or inside data)
          const token = response.token || response.data?.token;
          if (token) {
            sessionStorage.setItem('authToken', token);
          }

          // Always fetch fresh user from /users/me to avoid drift
          try {
            const me = await authApi.getCurrentUser();
            const user = me?.data; // unified: { success, data: User }
            if (user) {
              useAuthStore.getState().login(user);
            }
          } catch (e) {
            // If /users/me fails, ignore; user will be initialized later
            console.error(e);
          }

          // Navigate to dashboard
          router.push('/dashboard');
        } else {
          setError(response.message || 'Token exchange failed.');
          setLoading(false);
        }
      } catch (error: unknown) {
        console.error('Token exchange failed:', error);

        let errorMessage = 'An error occurred during authentication.';

        if (error && typeof error === 'object' && 'response' in error) {
          const response = (error as { response?: { status?: number } })
            .response;
          if (response?.status === 400) {
            errorMessage = 'Invalid authentication request.';
          } else if (response?.status === 401) {
            errorMessage = 'Authentication failed. Please try again.';
          } else if (response?.status === 500) {
            errorMessage = 'Server error occurred. Please try again later.';
          }
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    exchangeToken();
  }, [router]);

  const handleRetry = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold">
              Processing Authentication
            </h2>
            <p className="mt-2 text-sm">
              Please wait while we complete your authentication...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold">
              Authentication Error
            </h2>
            <p className="mt-2 text-sm">{error}</p>
          </div>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={handleRetry}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/login')}
              className="group relative w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
