import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { authApi } from '../../lib/api';
import { Spinner } from '../ui';
import axios, { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/lib/types';
import { Alert } from '../ui/alert';
import { Button } from '../ui/Button';
import Image from 'next/image';

const RegisterForm: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await authApi.register(email, password, name);

      router.push('/login?registered=true');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setError(axiosError.response?.data?.message || 'Registration failed');
      } else {
        setError('An unexpected error occurred during registration');
      }
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {error && (
        <Alert variant="error" className="mb-6">
          <p>{error}</p>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="text-sm font-medium text-[hsl(var(--foreground))]"
          >
            Name
          </label>
          <div className="relative">
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              disabled={loading}
              required
              className="w-full h-12 px-3 py-2 border border-input rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
            <User className="absolute right-3 top-3.5 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          </div>
        </div>

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
              className="absolute right-3 top-3.5 text-[hsl(var(--muted-foreground))]"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-[hsl(var(--foreground))]"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full h-12 px-3 py-2 border border-input rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Register'}
        </Button>
      </form>

      {/* 구분선 추가 */}
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

      {/* Google 로그인 버튼 */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 flex items-center justify-center gap-3 bg-white mb-4"
        onClick={() => {
          window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
        }}
      >
        <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
        Sign up with Google
      </Button>

      {/* GitHub 로그인 버튼 */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 flex items-center justify-center gap-3 bg-white"
        onClick={() => {
          window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
        }}
      >
        <Image src="/github-logo.svg" alt="GitHub" width={20} height={20} />
        Sign up with GitHub
      </Button>

      <div className="mt-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <p>
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[hsl(var(--primary))] font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
