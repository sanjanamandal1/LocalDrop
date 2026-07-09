import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--ld-ink)] text-sm font-black tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:pointer-events-none disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-50 active:translate-x-1 active:translate-y-1 active:shadow-none",
        variant === "primary" && "btn-shine-effect bg-[var(--ld-pink)] text-[#08050f] shadow-[4px_5px_0_var(--ld-ink)] hover:-translate-y-0.5 hover:bg-[var(--ld-lime)] hover:shadow-[6px_7px_0_var(--ld-ink)]",
        variant === "outline" && "bg-[var(--ld-surface)] text-foreground shadow-[3px_4px_0_var(--ld-ink)] hover:-translate-y-0.5 hover:bg-[var(--ld-cream)] hover:text-foreground hover:shadow-[5px_6px_0_var(--ld-ink)]",
        variant === "ghost" && "border-transparent bg-transparent text-foreground shadow-none hover:border-[var(--ld-ink)] hover:bg-[var(--ld-cream)] hover:shadow-[3px_4px_0_var(--ld-ink)]",
        variant === "danger" && "bg-[var(--ld-red)] text-[#08050f] shadow-[4px_5px_0_var(--ld-ink)] hover:-translate-y-0.5 hover:bg-[#ff735f] hover:shadow-[6px_7px_0_var(--ld-ink)]",
        size === "md" && "h-10 px-5",
        size === "sm" && "h-8 px-3.5 text-xs",
        size === "icon" && "h-10 w-10 px-0",
        className
      )}
      {...props}
    />
  );
}
