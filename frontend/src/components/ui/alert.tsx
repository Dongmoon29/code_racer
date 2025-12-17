import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-panel)] text-[var(--color-text)] border-[var(--gray-6)]',
        destructive:
          'bg-[var(--red-3)] border-[var(--red-6)] text-[var(--red-11)] dark:bg-[var(--red-2)] dark:border-[var(--red-6)] dark:text-[var(--red-11)]',
        info: 'bg-[var(--blue-3)] border-[var(--blue-6)] text-[var(--blue-11)] dark:bg-[var(--blue-2)] dark:border-[var(--blue-6)] dark:text-[var(--blue-11)]',
        success:
          'bg-[var(--green-3)] border-[var(--green-6)] text-[var(--green-11)] dark:bg-[var(--green-2)] dark:border-[var(--green-6)] dark:text-[var(--green-11)]',
        warning:
          'bg-[var(--amber-3)] border-[var(--amber-6)] text-[var(--amber-11)] dark:bg-[var(--amber-2)] dark:border-[var(--amber-6)] dark:text-[var(--amber-11)]',
        error:
          'bg-[var(--red-3)] border-[var(--red-6)] text-[var(--red-11)] dark:bg-[var(--red-2)] dark:border-[var(--red-6)] dark:text-[var(--red-11)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface AlertProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof alertVariants> {
  onClick?: () => void;
}

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('font-medium leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
