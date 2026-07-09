"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useI18n } from "@/i18n/provider";
import type { Role } from "@/types/api";

export function Protected({ role, children }: { role: Role; children: ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(`/${user.role}`);
  }, [role, router, user]);

  if (!user || user.role !== role) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">{t("common.loadingWorkspace")}</div>;
  }

  return children;
}
