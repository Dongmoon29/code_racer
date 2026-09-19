import React, { FC, InputHTMLAttributes, ReactNode } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import {
  formControlClass,
  formErrorClass,
  formLabelClass,
} from "@/components/ui/FormPrimitives";
import { cn } from "@/lib/utils";

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
    <div>
      <label htmlFor={inputProps.id} className={formLabelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          {...registration}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : inputProps["aria-describedby"]}
          className={cn(
            formControlClass,
            "h-12",
            (icon || rightElement) && "pr-11",
          )}
        />
        {icon && (
          <div
            aria-hidden="true"
            className="absolute right-3 top-3.5 text-[hsl(var(--muted-foreground))]"
          >
            {icon}
          </div>
        )}
        {rightElement && (
          <div className="absolute right-3 top-3.5">{rightElement}</div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className={formErrorClass}>
          {error}
        </p>
      )}
    </div>
  );
};
