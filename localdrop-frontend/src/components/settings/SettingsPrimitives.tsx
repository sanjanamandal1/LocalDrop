"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

export function SettingsCard({ title, description, children, className }: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function InputField({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <input
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        {...props}
      />
      {error ? <span className="mt-1 text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function SelectField({ label, error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <select
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        {...props}
      >
        {children}
      </select>
      {error ? <span className="mt-1 text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function TextAreaField({ label, error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <textarea
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        {...props}
      />
      {error ? <span className="mt-1 text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function ToggleSwitch({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition",
          checked ? "left-5" : "left-0.5"
        )} />
      </button>
    </div>
  );
}

export function SaveButton({ loading, children }: { loading?: boolean; children?: string }) {
  const { t } = useI18n();

  return (
    <button
      type="submit"
      disabled={loading}
      className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
    >
      {loading ? t("common.saving") : children || t("action.saveChanges")}
    </button>
  );
}

export function PasswordInput({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <InputField label={label} type="password" error={error} {...props} />;
}

export function StatusBadge({ status }: { status: "verified" | "pending" | "rejected" | "warning" }) {
  const { t } = useI18n();
  const styles = {
    verified: "bg-emerald-500/10 text-emerald-500",
    pending: "bg-amber-500/10 text-amber-500",
    rejected: "bg-red-500/10 text-red-500",
    warning: "bg-amber-500/10 text-amber-500",
  };
  const labels = {
    verified: t("common.verified"),
    pending: t("common.pending"),
    rejected: t("common.rejected"),
    warning: t("common.actionNeeded")
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", styles[status])}>
      {labels[status]}
    </span>
  );
}

export function VerificationCard({ title, status, description }: { title: string; status: "verified" | "pending" | "rejected" | "warning"; description: string }) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border p-4">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}
