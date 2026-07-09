"use client";

import { Eye, Gift, IndianRupee, QrCode, Sparkles, Lightbulb, TrendingUp } from "lucide-react";
import { Topbar } from "@/components/dashboard/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { HeatmapCard } from "@/components/dashboard/charts";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCreatorDashboardData } from "@/hooks/use-api";
import { currency, number, pct, cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import type { CampaignStat } from "@/types/api";

const parseInsight = (text: string) => {
  const match = text.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\S+)\s*([^:]+):\s*(.*)$/);
  if (match) {
    return {
      emoji: match[1],
      title: match[2].trim(),
      description: match[3].trim()
    };
  }
  return {
    emoji: "💡",
    title: "Insight",
    description: text
  };
};

interface InsightCardProps {
  text: string;
  tone: "success" | "warning" | "info";
}

function InsightCard({ text, tone }: InsightCardProps) {
  const { emoji, title, description } = parseInsight(text);
  
  const styles = {
    success: {
      border: "border-emerald-500/10 dark:border-emerald-500/25",
      bg: "bg-emerald-50/20 dark:bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.05]",
      line: "bg-emerald-500",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    },
    warning: {
      border: "border-amber-500/10 dark:border-amber-500/25",
      bg: "bg-amber-50/20 dark:bg-amber-500/[0.02] hover:bg-amber-500/[0.04] dark:hover:bg-amber-500/[0.05]",
      line: "bg-amber-500",
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    },
    info: {
      border: "border-indigo-500/10 dark:border-indigo-500/25",
      bg: "bg-indigo-50/20 dark:bg-indigo-500/[0.02] hover:bg-indigo-500/[0.04] dark:hover:bg-indigo-500/[0.05]",
      line: "bg-indigo-500",
      badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
    }
  }[tone];

  return (
    <div className={`relative flex flex-col justify-between overflow-hidden rounded-xl border ${styles.border} ${styles.bg} p-5 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.line}`} />
      <div className="pl-2">
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center justify-center rounded-lg p-1.5 text-base ${styles.badge}`}>
            {emoji}
          </span>
          <h3 className="font-bold text-foreground text-sm tracking-wide">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function CreatorAnalyticsPage() {
  const { t } = useI18n();
  const { overview, campaigns } = useCreatorDashboardData();

  const views = Number(overview.data?.total_qr_views) || 0;
  const claims = Number(overview.data?.total_claims) || 0;
  const redemptions = Number(overview.data?.total_redemptions) || 0;
  const earnings = Number(overview.data?.total_earnings) || 0;

  // Calculate dynamic metrics
  const claimRate = views > 0 ? (claims / views) * 100 : 0;
  const redemptionRate = claims > 0 ? (redemptions / claims) * 100 : 0;
  const overallConversion = views > 0 ? (redemptions / views) * 100 : 0;
  const avgEarning = redemptions > 0 ? earnings / redemptions : 0;

  return (
    <>
      <Topbar title={t("nav.analytics")} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          icon={Eye} 
          label={t("common.qrViews")} 
          value={number(views)} 
          hint={t("dashboard.hint.claimRate", { rate: claimRate.toFixed(1) })}
        />
        <StatCard 
          icon={Gift} 
          label={t("common.claims")} 
          value={number(claims)} 
          tone="green" 
          hint={t("dashboard.hint.claimToRedemptionRate", { rate: redemptionRate.toFixed(1) })}
        />
        <StatCard 
          icon={QrCode} 
          label={t("common.redemptions")} 
          value={number(redemptions)} 
          tone="amber" 
          hint={t("dashboard.hint.conversionRate", { rate: overallConversion.toFixed(1) })}
        />
        <StatCard 
          icon={IndianRupee} 
          label={t("common.earnings")} 
          value={currency(earnings)} 
          tone="blue" 
          hint={t("dashboard.hint.avgEarnings", { amount: currency(avgEarning) })}
        />
      </div>

      <div className="mt-5 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h2 className="font-semibold text-foreground text-base tracking-wide">{t("dashboard.aiInsightsTitle")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InsightCard 
            text={
              overallConversion > 8 
                ? t("dashboard.creator.insight1.high", { rate: overallConversion.toFixed(1) })
                : overallConversion >= 3
                ? t("dashboard.creator.insight1.medium", { rate: overallConversion.toFixed(1) })
                : t("dashboard.creator.insight1.low", { rate: overallConversion.toFixed(1) })
            }
            tone={overallConversion > 8 ? "success" : overallConversion >= 3 ? "info" : "warning"}
          />
          <InsightCard 
            text={
              redemptionRate < 35
                ? t("dashboard.creator.insight2.low", { rate: redemptionRate.toFixed(1) })
                : t("dashboard.creator.insight2.high", { rate: redemptionRate.toFixed(1) })
            }
            tone={redemptionRate >= 35 ? "success" : "warning"}
          />
          <InsightCard 
            text={t("dashboard.creator.insight3", { amount: currency(avgEarning) })}
            tone="success"
          />
        </div>
      </div>

      <div className="mt-5"><HeatmapCard /></div>
      <div className="mt-5">
        <DataTable<CampaignStat>
          rows={campaigns.data}
          columns={[
            { key: "name", label: t("common.campaign") },
            { key: "business_name", label: t("common.business") },
            { 
              key: "status", 
              label: t("common.status"), 
              render: (r) => {
                const tone = 
                  r.status === "active" ? "green" :
                  r.status === "paused" ? "amber" :
                  r.status === "ended" ? "gray" :
                  r.status === "cancelled" ? "red" : "purple";
                return <Badge tone={tone}>{r.status ? t(`status.${r.status}` as any) || r.status : ""}</Badge>;
              }
            },
            { key: "qr_views", label: t("common.qrViews"), render: (r) => number(r.qr_views) },
            { key: "claims", label: t("common.claims"), render: (r) => number(r.claims) },
            { key: "redemptions", label: t("common.redemptions"), render: (r) => number(r.redemptions) },
            { 
              key: "conversion_rate", 
              label: t("common.conversion"), 
              render: (r) => {
                const rate = Number(r.conversion_rate ?? 0);
                return (
                  <span className={cn(
                    "font-semibold",
                    rate >= 10 ? "text-emerald-600" : rate <= 2 && rate > 0 ? "text-red-500" : "text-slate-700"
                  )}>
                    {pct(rate)}
                  </span>
                );
              }
            }
          ]}
        />
      </div>
    </>
  );
}
