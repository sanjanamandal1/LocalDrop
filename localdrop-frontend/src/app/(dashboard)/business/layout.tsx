import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout role="business">{children}</DashboardLayout>;
}
