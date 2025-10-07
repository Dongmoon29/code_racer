import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(iso?: string, fallback?: string): string {
  if (!iso) return fallback ?? 'N/A'
  const end = new Date(iso).getTime()
  if (Number.isNaN(end)) return fallback ?? 'N/A'
  const now = Date.now()
  const diff = Math.max(0, now - end)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day

  if (diff >= year) return `${Math.floor(diff / year)}y ago`
  if (diff >= month) return `${Math.floor(diff / month)}mo ago`
  if (diff >= week) return `${Math.floor(diff / week)}w ago`
  if (diff >= day) return `${Math.floor(diff / day)}d ago`
  if (diff >= hour) return `${Math.floor(diff / hour)}h ago`
  if (diff >= minute) return `${Math.floor(diff / minute)}m ago`
  return 'just now'
}
