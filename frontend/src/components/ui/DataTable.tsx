import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DataTableShell({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)] shadow-[0_18px_50px_rgba(0,0,0,0.12)]',
        className
      )}
      {...props}
    />
  );
}

export function DataTable({
  className,
  ...props
}: React.ComponentProps<'table'>) {
  return (
    <table
      className={cn('w-full border-collapse text-left', className)}
      {...props}
    />
  );
}

export function DataTableHead({
  className,
  ...props
}: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('bg-[var(--gray-2)] text-[var(--gray-11)]', className)}
      {...props}
    />
  );
}

export function DataTableHeaderCell({
  className,
  ...props
}: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em]',
        className
      )}
      {...props}
    />
  );
}

export function DataTableBody({
  className,
  ...props
}: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('text-[var(--gray-12)]', className)} {...props} />;
}

export function DataTableRow({
  className,
  ...props
}: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b border-[var(--gray-5)] transition-colors last:border-b-0 hover:bg-[var(--gray-a2)]',
        className
      )}
      {...props}
    />
  );
}

export function DataTableCell({
  className,
  ...props
}: React.ComponentProps<'td'>) {
  return <td className={cn('px-5 py-4 align-middle', className)} {...props} />;
}

export function DataTableEmpty({
  title,
  description,
  colSpan,
}: {
  title: string;
  description?: string;
  colSpan: number;
}) {
  return (
    <DataTableRow className="hover:bg-transparent">
      <DataTableCell colSpan={colSpan} className="px-6 py-16 text-center">
        <p className="text-sm font-semibold text-[var(--gray-12)]">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-[var(--gray-10)]">{description}</p>
        )}
      </DataTableCell>
    </DataTableRow>
  );
}

export function MobileDisclosureCard({
  title,
  description,
  badge,
  expanded,
  onToggle,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const contentId = React.useId();

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border bg-[var(--color-panel)] transition-[border-color,background-color,box-shadow] duration-200',
        expanded
          ? 'border-[var(--accent-7)] bg-[var(--accent-a2)] shadow-[0_12px_30px_rgba(0,0,0,0.14)]'
          : 'border-[var(--gray-6)] hover:border-[var(--gray-7)]',
        className
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-8)]"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={onToggle}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[var(--gray-12)]">
            {title}
          </span>
          {description && (
            <span className="mt-1 block truncate text-xs text-[var(--gray-10)]">
              {description}
            </span>
          )}
        </span>
        {badge && <span className="shrink-0">{badge}</span>}
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--gray-6)] bg-[var(--gray-a2)] text-[var(--gray-10)] transition-all duration-200',
            expanded &&
              'rotate-180 border-[var(--accent-7)] bg-[var(--accent-a3)] text-[var(--accent-11)]'
          )}
          aria-hidden="true"
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      {expanded && (
        <div
          id={contentId}
          className="border-t border-[var(--gray-6)] px-4 py-4"
        >
          {children}
        </div>
      )}
    </article>
  );
}
