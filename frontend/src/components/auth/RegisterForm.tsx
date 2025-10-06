import React, { useState, FC } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi } from '@/lib/api';
import { Spinner } from '../ui';
import axios, { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types';
import { Alert } from '../ui/alert';
import { Button } from '../ui/Button';
import Image from 'next/image';
import { registerSchema, RegisterFormData } from '@/lib/validations/auth';

const RegisterForm: FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);

      await authApi.register(data.email, data.password, data.name);

      router.push('/login?registered=true');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setError(axiosError.response?.data?.message || 'Registration failed');
      } else {
        setError('An unexpected error occurred during registration');
      }
      console.error('Registration failed:', err);
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="text-sm font-medium text-[hsl(var(--foreground))]"
          >
            이름
          </label>
          <div className="relative">
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="홍길동"
              disabled={loading}
              className={`w-full h-12 px-3 py-2 border rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none ${
                errors.name ? 'border-red-500' : 'border-input'
              }`}
            />
            <User className="absolute right-3 top-3.5 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          </div>
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-[hsl(var(--foreground))]"
          >
            이메일
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
            비밀번호
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
              className="absolute right-3 top-3.5 text-[hsl(var(--muted-foreground))]"
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

        <div className="space-y-1">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-[hsl(var(--foreground))]"
          >
            비밀번호 확인
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              disabled={loading}
              className={`w-full h-12 px-3 py-2 border rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none ${
                errors.confirmPassword ? 'border-red-500' : 'border-input'
              }`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
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

      <div className="flex gap-4 justify-center">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-12 flex items-center justify-center gap-3 bg-gray-300 mb-4 rounded-full"
          onClick={() => {
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
          }}
        >
          <Image src="/google-logo.svg" alt="Google" width={30} height={30} />
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
          <Image src="/github-logo.svg" alt="GitHub" width={30} height={30} />
        </Button>
      </div>

      <div className="mt-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <p>
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[hsl(var(--primary))] font-medium hover:underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
