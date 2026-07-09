import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currency(value?: number | string | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function number(value?: number | string | null) {
  return new Intl.NumberFormat("en-IN").format(Number(value ?? 0));
}

export function dateLabel(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function pct(value?: number | string | null) {
  const n = Number(value ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(1) : "0.0"}%`;
}
