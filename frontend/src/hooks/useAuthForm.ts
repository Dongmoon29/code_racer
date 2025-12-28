import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { extractErrorMessage } from '@/lib/error-utils';
import type { AnyObjectSchema } from 'yup';

interface UseAuthFormOptions<T> {
  schema: AnyObjectSchema;
  onSubmit: (data: T) => Promise<void>;
  defaultErrorMessage?: string;
}

interface UseAuthFormReturn<T> {
  form: UseFormReturn<T>;
  loading: boolean;
  error: string | null;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  handleFormSubmit: (data: T) => Promise<void>;
}

/**
 * Reusable hook for authentication forms (login, register, etc.)
 * Consolidates common form state management, validation, and error handling
 */
export function useAuthForm<T>({
  schema,
  onSubmit,
  defaultErrorMessage = 'Operation failed',
}: UseAuthFormOptions<T>): UseAuthFormReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<T>({
    resolver: yupResolver(schema),
    mode: 'onBlur',
  });

  const handleFormSubmit = async (data: T) => {
    try {
      setLoading(true);
      setError(null);
      await onSubmit(data);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Form submission failed:', err);
      }
      setError(extractErrorMessage(err, defaultErrorMessage));
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    error,
    showPassword,
    setShowPassword,
    handleFormSubmit,
  };
}
