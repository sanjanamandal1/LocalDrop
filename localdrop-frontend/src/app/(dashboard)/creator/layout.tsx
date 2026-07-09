import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout role="creator">{children}</DashboardLayout>;
}
