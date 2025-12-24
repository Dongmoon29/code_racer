import React, { useState, FC } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi } from '@/lib/api';
import { Loader } from '../ui/Loader';
import { Alert } from '../ui/alert';
import { Button } from '../ui/Button';
import { registerSchema, RegisterFormData } from '@/lib/validations/auth';
import { OAuthButtons } from './OAuthButtons';
import { FormField } from './FormField';
import { extractErrorMessage } from '@/lib/error-utils';

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
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration failed:', err);
      }
      setError(extractErrorMessage(err, 'Registration failed'));
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
        <FormField
          id="name"
          label="Name"
          type="text"
          placeholder="John Doe"
          registration={register('name')}
          error={errors.name?.message}
          disabled={loading}
          icon={<User className="h-5 w-5" />}
        />

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
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }
        />

        <FormField
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          registration={register('confirmPassword')}
          error={errors.confirmPassword?.message}
          disabled={loading}
        />

        <Button type="submit" className="!w-full h-12" disabled={loading} style={{ width: '100%' }}>
          {loading ? <Loader variant="inline" size="sm" /> : 'Register'}
        </Button>
      </form>

      <OAuthButtons disabled={loading} />

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
