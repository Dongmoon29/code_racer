import React, { FC } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { authApi } from '../../lib/api';
import { Loader } from '../ui/Loader';
import { Button } from '../ui/Button';
import { Alert } from '../ui/alert';
import { useRouterHelper } from '@/lib/router';
import { useAuthStore } from '../../stores/authStore';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { OAuthButtons } from './OAuthButtons';
import { FormField } from './FormField';
import { useAuthForm } from '@/hooks/useAuthForm';

const LoginForm: FC = () => {
  const router = useRouter();
  const routerHelper = useRouterHelper(router);

  const onSubmit = async (data: LoginFormData) => {
    const response = await authApi.login(data.email, data.password);

    if (response.success) {
      // Store token in sessionStorage for all authentication (HTTP + WebSocket)
      if (response.data?.token) {
        sessionStorage.setItem('authToken', response.data.token);
      }

      // Always sync authStore with fresh /users/me to avoid drift
      try {
        const meResponse = await authApi.getCurrentUser();
        if (meResponse.success) {
          useAuthStore.getState().login(meResponse.data);
        }
      } catch (e) {
        // If /users/me fails, fall back to login response user under data.user
        if (response.success && response.data.user) {
          useAuthStore.getState().login(response.data.user);
        }
        if (process.env.NODE_ENV === 'development') {
          console.error(e);
        }
      }

      const redirect = router.query.redirect as string;
      if (redirect) {
        await routerHelper.push(redirect);
      } else {
        await routerHelper.goToDashboard();
      }
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const {
    form: {
      register,
      handleSubmit,
      formState: { errors },
    },
    loading,
    error,
    showPassword,
    setShowPassword,
    handleFormSubmit,
  } = useAuthForm<LoginFormData>({
    schema: loginSchema,
    onSubmit,
    defaultErrorMessage: 'Invalid email or password',
  });

  return (
    <div className="mx-auto w-full max-w-md">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <p>{error}</p>
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          registration={register('email')}
          error={errors.email?.message}
          disabled={loading}
          icon={<Mail className="h-5 w-5" />}
        />

        <FormField
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          registration={register('password')}
          error={errors.password?.message}
          disabled={loading}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }
        />

        <Button type="submit" className="!w-full h-12" disabled={loading} style={{ width: '100%' }}>
          {loading ? <Loader variant="inline" size="sm" /> : 'Login'}
        </Button>
      </form>

      <OAuthButtons disabled={loading} />

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
