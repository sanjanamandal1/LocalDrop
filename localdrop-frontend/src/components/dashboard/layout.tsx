"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Protected } from "@/components/dashboard/protected";
import type { Role } from "@/types/api";

export function DashboardLayout({ role, children }: { role: Role; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Protected role={role}>
      <div className="ld-app-shell relative min-h-screen overflow-hidden text-foreground transition-colors duration-200">
        <div className="ld-app-grid absolute inset-0 pointer-events-none" />

        <Sidebar role={role} />
        <main className="ld-page-stage relative z-10 px-4 py-5 lg:ml-[236px] lg:px-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </Protected>
  );
}
