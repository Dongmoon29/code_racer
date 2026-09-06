import type { LucideIcon } from "lucide-react";

interface ResultStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  tone: "cyan" | "violet";
}

const iconTone = {
  cyan: "bg-cyan-500/10 text-cyan-400",
  violet: "bg-violet-500/10 text-violet-400",
} as const;

export function ResultStatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: ResultStatCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)]/70 p-4 shadow-lg backdrop-blur">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconTone[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-[var(--gray-11)]">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-[var(--color-text)] sm:text-2xl">
        {value}
      </div>
      {detail ? (
        <div className="mt-1 text-xs text-[var(--gray-10)]">{detail}</div>
      ) : null}
    </div>
  );
}
