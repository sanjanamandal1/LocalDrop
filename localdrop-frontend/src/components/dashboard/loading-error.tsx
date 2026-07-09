"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { apiError } from "@/lib/api";
import { useI18n } from "@/i18n/provider";

export function LoadingError({ isLoading, error, children }: { isLoading?: boolean; error?: unknown; children: ReactNode }) {
  const { t } = useI18n();
  if (isLoading) return <Card><CardContent className="p-8 text-sm text-muted-foreground">{t("common.loadingData")}</CardContent></Card>;
  if (error) return <Card><CardContent className="p-8 text-sm text-red-600">{apiError(error)}</CardContent></Card>;
  return <>{children}</>;
}
