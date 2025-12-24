import React, { useState, FC } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi } from '../../lib/api';
import { Loader } from '../ui/Loader';
import { Button } from '../ui/Button';
import { Alert } from '../ui/alert';
import { useRouterHelper } from '@/lib/router';
import { useAuthStore } from '../../stores/authStore';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { OAuthButtons } from './OAuthButtons';
import { FormField } from './FormField';
import { extractErrorMessage } from '@/lib/error-utils';

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
        // Store token in sessionStorage for all authentication (HTTP + WebSocket)
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
        setError(response.message || 'Login failed');
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Login failed:', err);
      }
      setError(extractErrorMessage(err, 'Invalid email or password'));
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
