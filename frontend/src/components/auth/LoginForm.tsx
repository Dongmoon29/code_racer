import React, { useState, FC } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi } from '../../lib/api';
import { Spinner } from '../ui';
import axios from 'axios';
import { Button } from '../ui/Button';
import { Alert } from '../ui/alert';
import Image from 'next/image';
import { useRouterHelper } from '@/lib/router';
import { useAuthStore } from '../../stores/authStore';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';

const LoginForm: FC = () => {
  const router = useRouter();
  const routerHelper = useRouterHelper(router);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.login(data.email, data.password);

      if (response.success) {
        // Security: Store token in sessionStorage (more secure than localStorage)
        // sessionStorage is cleared when browser tab is closed
        if (response.data?.token) {
          sessionStorage.setItem('authToken', response.data.token);
        }

        // Always sync authStore with fresh /users/me to avoid drift
        try {
          const meResponse = await authApi.getCurrentUser();
          const user = meResponse?.data; // unified: { success, data: User }
          if (user) {
            useAuthStore.getState().login(user);
          }
        } catch (e) {
          // If /users/me fails, fall back to login response user under data.user
          const fallbackUser = response?.data?.user;
          if (fallbackUser) {
            useAuthStore.getState().login(fallbackUser);
          }
          console.error(e);
        }

        const redirect = router.query.redirect as string;
        if (redirect) {
          await routerHelper.push(redirect);
        } else {
          await routerHelper.goToDashboard();
        }
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-[hsl(var(--foreground))]"
          >
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="you@example.com"
              disabled={loading}
              className={`w-full h-12 px-3 py-2 border rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none ${
                errors.email ? 'border-red-500' : 'border-input'
              }`}
            />
            <Mail className="absolute right-3 top-3.5 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
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
              {...register('password')}
              disabled={loading}
              className={`w-full h-12 px-3 py-2 border rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none ${
                errors.password ? 'border-red-500' : 'border-input'
              }`}
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
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Login'}
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

      <div className="flex gap-4 justify-center">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-12 flex items-center justify-center gap-3 bg-gray-300 mb-4 rounded-full"
          onClick={() => {
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
          }}
        >
          <Image
            src="/google-logo.svg"
            alt="Google"
            width={30}
            height={30}
            sizes="30px"
            priority
          />
        </Button>

        {/* GitHub Login Button */}
        <Button
          type="button"
          variant="outline"
          className="h-12 w-12 flex items-center justify-center gap-3 bg-gray-300 mb-4 rounded-full"
          onClick={() => {
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
          }}
        >
          <Image
            src="/github-logo.svg"
            alt="GitHub"
            width={30}
            height={30}
            sizes="30px"
            priority
          />
        </Button>
      </div>
      {/* Google Login Button  */}

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
