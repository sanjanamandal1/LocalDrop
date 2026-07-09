"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-md border bg-card p-1", className)} aria-label={t("language.toggle")}>
      <Languages className="mx-1 h-4 w-4 text-muted-foreground" />
      <Button
        type="button"
        size="sm"
        variant={language === "en" ? "primary" : "ghost"}
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        EN
      </Button>
      <Button
        type="button"
        size="sm"
        variant={language === "hi" ? "primary" : "ghost"}
        aria-pressed={language === "hi"}
        onClick={() => setLanguage("hi")}
      >
        HI
      </Button>
    </div>
  );
}
