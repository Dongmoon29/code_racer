import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-[var(--gray-5)] motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading content" role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rounded-xl border border-[var(--gray-6)] bg-[var(--color-panel)] p-4">
          <div className="flex gap-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex gap-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-16" /></div>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl py-3 sm:py-6" aria-label="Loading profile" role="status">
      <div className="mb-8 space-y-3"><Skeleton className="h-9 w-72 max-w-full" /><Skeleton className="h-4 w-80 max-w-full" /></div>
      <div className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
        <div className="rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)] p-6">
          <div className="flex flex-col items-center gap-4"><Skeleton className="h-44 w-44 rounded-full" /><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-44" /><Skeleton className="h-10 w-full" /></div>
          <div className="mt-6 space-y-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-5 w-full" />)}</div>
        </div>
        <div className="rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)] p-6">
          <Skeleton className="h-5 w-28" /><Skeleton className="mt-4 h-8 w-3/4" /><Skeleton className="mt-3 h-4 w-2/3" />
          <div className="mt-8 space-y-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-20 w-full rounded-xl" />)}</div>
          <Skeleton className="mt-8 h-11 w-full" />
        </div>
        <div className="space-y-4 xl:col-start-2"><Skeleton className="h-11 w-full" /><Skeleton className="h-32 w-full rounded-xl" /><Skeleton className="h-32 w-full rounded-xl" /></div>
      </div>
      <span className="sr-only">Loading profile</span>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div aria-label="Loading leaderboard" role="status">
      <div className="mb-10 flex flex-col items-center gap-3"><Skeleton className="h-12 w-12 rounded-full" /><Skeleton className="h-12 w-72 max-w-full" /><Skeleton className="h-5 w-44" /></div>
      <div className="mx-auto mb-10 grid max-w-5xl gap-5 md:grid-cols-3 md:items-end"><Skeleton className="h-56 rounded-3xl md:h-64" /><Skeleton className="h-56 rounded-3xl md:h-72" /><Skeleton className="h-56 rounded-3xl md:h-64" /></div>
      <div className="mx-auto max-w-4xl space-y-3">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-16 w-full rounded-xl" />)}</div>
      <span className="sr-only">Loading leaderboard</span>
    </div>
  );
}

export function GameRoomSkeleton() {
  return (
    <div className="grid h-full min-h-[32rem] gap-px bg-[var(--gray-6)] lg:grid-cols-[minmax(20rem,38%)_1fr]" aria-label="Loading game" role="status">
      <div className="space-y-5 bg-[var(--color-background)] p-5"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-10 w-full" /><div className="space-y-3 pt-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-11/12" /><Skeleton className="h-5 w-4/5" /></div><Skeleton className="h-36 w-full rounded-xl" /></div>
      <div className="bg-[var(--color-panel)]"><div className="flex h-12 items-center justify-between border-b border-[var(--gray-6)] px-4"><Skeleton className="h-5 w-20" /><Skeleton className="h-8 w-28" /></div><div className="space-y-4 p-5">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-4" style={{ width: `${Math.max(34, 82 - index * 5)}%` }} />)}</div></div>
      <span className="sr-only">Loading game</span>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6" aria-label="Loading form" role="status">
      <Skeleton className="h-9 w-56" />
      {Array.from({ length: 5 }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className={index === 1 ? "h-32 w-full" : "h-11 w-full"} /></div>)}
      <div className="flex justify-end gap-3"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-28" /></div>
      <span className="sr-only">Loading form</span>
    </div>
  );
}
