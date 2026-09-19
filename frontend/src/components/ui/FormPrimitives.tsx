import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const formControlClass = cn(
  "w-full rounded-xl border border-[var(--gray-6)] bg-[var(--color-panel)]",
  "px-3.5 py-2.5 text-sm text-[var(--color-text)] shadow-sm outline-none",
  "transition-[border-color,box-shadow,background-color] placeholder:text-[var(--gray-9)]",
  "hover:border-[var(--gray-7)] focus:border-[var(--accent-8)] focus:ring-4 focus:ring-[var(--accent-5)]/25",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/15",
);

export const formLabelClass =
  "mb-1.5 block text-sm font-semibold text-[var(--color-text)]";

export const formHintClass = "mt-1.5 text-xs leading-5 text-[var(--gray-10)]";

export const formErrorClass = "mt-1.5 text-xs font-medium text-red-500";

export const secondaryFormButtonClass = cn(
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--gray-6)]",
  "bg-transparent px-4 text-sm font-semibold text-[var(--color-text)] transition-colors",
  "hover:border-[var(--gray-8)] hover:bg-[var(--gray-3)] disabled:cursor-not-allowed disabled:opacity-50",
);

export const primaryFormButtonClass = cn(
  "inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--accent-9)]",
  "px-5 text-sm font-semibold text-white shadow-sm transition-colors",
  "hover:bg-[var(--accent-10)] disabled:cursor-not-allowed disabled:opacity-50",
);

export const dangerFormButtonClass = cn(
  "inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold",
  "text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50",
);

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headingId?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
  headingId,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)] p-4 sm:p-6",
        className,
      )}
      aria-labelledby={headingId}
    >
      <div className="mb-5">
        <h3
          id={headingId}
          className="text-base font-semibold text-[var(--color-text)]"
        >
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm font-normal leading-6 text-[var(--gray-10)]">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
