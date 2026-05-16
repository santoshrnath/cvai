import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name?: string | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function formatYears(y?: number | null): string {
  if (y == null) return "—";
  if (y < 1) return "<1 yr";
  return `${y.toFixed(y % 1 === 0 ? 0 : 1)} yrs`;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function toArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  return [];
}
