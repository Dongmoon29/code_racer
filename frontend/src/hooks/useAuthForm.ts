import { useState } from "react";
import {
  useForm,
  UseFormReturn,
  FieldValues,
  type Resolver,
} from "react-hook-form";
import { extractErrorMessage } from "@/lib/error-utils";

interface UseAuthFormOptions<T extends FieldValues> {
  resolver: Resolver<T>;
  onSubmit: (data: T) => Promise<void>;
  defaultErrorMessage?: string;
}

interface UseAuthFormReturn<T extends FieldValues> {
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
export function useAuthForm<T extends FieldValues>({
  resolver,
  onSubmit,
  defaultErrorMessage = "Operation failed",
}: UseAuthFormOptions<T>): UseAuthFormReturn<T> {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<T>({
    resolver,
    mode: "onBlur",
  });

  const handleFormSubmit = async (data: T) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Form submission failed:", err);
      }
      setError(extractErrorMessage(err, defaultErrorMessage));
    }
  };

  return {
    form,
    loading: form.formState.isSubmitting,
    error,
    showPassword,
    setShowPassword,
    handleFormSubmit,
  };
}
