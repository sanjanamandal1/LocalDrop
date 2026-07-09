import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn("h-11 w-full rounded-[14px] border-2 border-[var(--ld-ink)] bg-[var(--ld-surface)] px-3.5 text-sm font-semibold text-foreground shadow-[3px_4px_0_rgba(8,5,15,0.18)] outline-none transition-all duration-200 placeholder:font-medium placeholder:text-muted-foreground hover:-translate-y-0.5 hover:shadow-[4px_5px_0_rgba(8,5,15,0.28)]", className)}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn("min-h-24 w-full rounded-[14px] border-2 border-[var(--ld-ink)] bg-[var(--ld-surface)] px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-[3px_4px_0_rgba(8,5,15,0.18)] outline-none transition-all duration-200 placeholder:font-medium placeholder:text-muted-foreground hover:-translate-y-0.5 hover:shadow-[4px_5px_0_rgba(8,5,15,0.28)]", className)}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn("h-11 w-full rounded-[14px] border-2 border-[var(--ld-ink)] bg-[var(--ld-surface)] px-3.5 text-sm font-black text-foreground shadow-[3px_4px_0_rgba(8,5,15,0.18)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_5px_0_rgba(8,5,15,0.28)]", className)}
        {...props}
      />
    );
  }
);
Select.displayName = "Select";
