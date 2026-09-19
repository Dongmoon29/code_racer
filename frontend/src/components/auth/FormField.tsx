import React, { FC, InputHTMLAttributes, ReactNode } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  icon?: ReactNode;
  rightElement?: ReactNode;
}

export const FormField: FC<FormFieldProps> = ({
  label,
  error,
  registration,
  icon,
  rightElement,
  disabled,
  ...inputProps
}) => {
  const errorId = inputProps.id ? `${inputProps.id}-error` : undefined;

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputProps.id}
        className="text-sm font-medium text-[hsl(var(--foreground))]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          {...registration}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : inputProps['aria-describedby']}
          className={`w-full h-12 px-3 py-2 border rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none ${icon || rightElement ? 'pr-11' : ''} ${
            error ? 'border-red-500' : 'border-input'
          }`}
        />
        {icon && (
          <div aria-hidden="true" className="absolute right-3 top-3.5 text-[hsl(var(--muted-foreground))]">
            {icon}
          </div>
        )}
        {rightElement && (
          <div className="absolute right-3 top-3.5">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};
