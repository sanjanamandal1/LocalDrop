import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, hint, icon: Icon, tone = "purple" }: { label: string; value: string | number; hint?: string; icon?: LucideIcon; tone?: "purple" | "green" | "amber" | "blue" }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          {Icon ? (
            <div className={cn("grid h-12 w-12 place-items-center rounded-[16px] border-2 border-[var(--ld-ink)] text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]", tone === "purple" && "bg-[var(--ld-pink)]", tone === "green" && "bg-[var(--ld-mint)]", tone === "amber" && "bg-[var(--ld-amber)]", tone === "blue" && "bg-[var(--ld-sky)]")}>
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
            {hint ? <p className="mt-1 text-xs font-black text-[var(--ld-mint)]">{hint}</p> : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
