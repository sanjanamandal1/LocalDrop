import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "purple" | "gray" | "amber" | "red" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 border-[var(--ld-ink)] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#08050f] shadow-[2px_3px_0_var(--ld-ink)] transition-all duration-200",
        tone === "green" && "bg-[var(--ld-mint)]",
        tone === "purple" && "bg-[var(--ld-violet)] text-white",
        tone === "gray" && "bg-[var(--ld-cream)] text-foreground",
        tone === "amber" && "bg-[var(--ld-amber)]",
        tone === "red" && "bg-[var(--ld-red)]"
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-85" />
      {children}
    </span>
  );
}
