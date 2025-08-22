import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { authApi, extractUserFromResponse } from '../../lib/api';
import { Spinner } from '../ui';
import axios from 'axios';
import { Button } from '../ui/Button';
import { Alert } from '../ui/alert';
import Image from 'next/image';
import { useAuthStore } from '../../stores/authStore';

const LoginForm: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const response = await authApi.login(email, password);

      if (response.success) {
        if (response.data?.token) {
          localStorage.setItem('authToken', response.data.token);
        }

        const user = extractUserFromResponse(response);
        if (user) {
          useAuthStore.getState().login(user);
        }

        const redirect = router.query.redirect as string;
        await router.push(redirect || '/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: unknown) {
      console.error('Login failed:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Invalid email or password');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <p>{error}</p>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-[hsl(var(--foreground))]"
          >
            E-mail
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              required
              className="w-full h-12 px-3 py-2 border border-input rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
            <Mail className="absolute right-3 top-3.5 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-medium text-[hsl(var(--foreground))]"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full h-12 px-3 py-2 border border-input rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Sign In'}
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[hsl(var(--border))]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] rounded-2xl">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google Login Button  */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 flex items-center justify-center gap-3 bg-white mb-4"
        onClick={() => {
          window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
        }}
      >
        <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
        Sign in with Google
      </Button>

      {/* GitHub Login Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 flex items-center justify-center gap-3 bg-white"
        onClick={() => {
          window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
        }}
      >
        <Image src="/github-logo.svg" alt="GitHub" width={20} height={20} />
        Sign in with GitHub
      </Button>

      <div className="mt-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <p>
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-[hsl(var(--primary))] font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
