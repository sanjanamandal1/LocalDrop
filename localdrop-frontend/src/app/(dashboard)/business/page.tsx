"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift, IndianRupee, QrCode, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/dashboard/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutChart, TimelineChart } from "@/components/dashboard/charts";
import { LoadingError } from "@/components/dashboard/loading-error";
import { useBusinessCampaigns, useBusinessDashboardData } from "@/hooks/use-api";
import { currency, number, pct } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { assetUrl } from "@/lib/assetUrl";
import type { Campaign } from "@/types/api";

function getFallbackGradient(type: string): string {
  const gradients: Record<string, string> = {
    discount: "from-rose-500 to-orange-500",
    bogo: "from-amber-500 to-yellow-500",
    freebie: "from-emerald-500 to-teal-500",
    cashback: "from-indigo-500 to-blue-500",
  };
  return gradients[type] || "from-purple-500 to-pink-500";
}

export default function BusinessDashboard() {
  const { t } = useI18n();
  const { overview, timeline, cities } = useBusinessDashboardData();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const campaigns = useBusinessCampaigns();
  const top = campaigns.data?.[0];
  return (
    <>
      <Topbar title={t("dashboard.goodMorning")} action={<Link href="/business/campaigns/create"><Button>{t("action.createCampaignPlus")}</Button></Link>} />
      <LoadingError isLoading={overview.isLoading} error={overview.error}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Gift} label={t("dashboard.activeCampaigns")} value={number(overview.data?.active_campaigns)} tone="purple" />
          <StatCard icon={QrCode} label={t("dashboard.totalRedemptions")} value={number(overview.data?.total_redemptions)} tone="green" />
          <StatCard icon={IndianRupee} label={t("dashboard.totalRevenue")} value={currency(overview.data?.total_revenue)} tone="amber" />
          <StatCard icon={WalletCards} label={t("dashboard.pendingPayout")} value={currency(overview.data?.pending_payouts)} tone="blue" />
        </div>
      </LoadingError>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <TimelineChart title={t("dashboard.redemptionsOverTime")} data={timeline.data} />
        <Card>
          <CardHeader><CardTitle>{t("dashboard.topPerformingCampaign")}</CardTitle></CardHeader>
          <CardContent>
            {top ? (
              <div className="space-y-4">
                {top.image_url && !imageErrors[top.id] ? (
                  <img
                    className="h-32 w-full rounded-lg object-cover"
                    src={assetUrl(top.image_url)}
                    alt={top.name}
                    onError={() => setImageErrors((prev) => ({ ...prev, [top.id]: true }))}
                  />
                ) : (
                  <div className={`h-32 rounded-lg bg-gradient-to-br ${getFallbackGradient(top.campaign_type)} flex flex-col items-center justify-center text-white p-4 shadow-inner`}>
                    <span className="text-sm font-bold text-center line-clamp-2 max-w-full drop-shadow-sm">{top.name}</span>
                    <span className="text-[9px] uppercase tracking-wider mt-1.5 px-1.5 py-0.5 bg-black/25 rounded-full font-semibold">{top.campaign_type}</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{top.offer_details}</h3><p className="text-sm text-muted-foreground">{top.name}</p></div><Badge>{top.status}</Badge></div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-muted-foreground">{t("common.redemptions")}</p><strong>{number(top.total_redemptions)}</strong></div>
                  <div><p className="text-muted-foreground">{t("common.revenue")}</p><strong>{currency(top.total_revenue)}</strong></div>
                  <div><p className="text-muted-foreground">{t("dashboard.rate")}</p><strong>{pct(overview.data?.conversion_rate)}</strong></div>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">{t("dashboard.noCampaignsYet")}</p>}
          </CardContent>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <DataTable<Campaign>
          rows={campaigns.data}
          columns={[
            { key: "name", label: t("common.campaign") },
            { key: "status", label: t("common.status"), render: (r) => <Badge tone={r.status === "active" ? "green" : "gray"}>{r.status}</Badge> },
            { key: "total_redemptions", label: t("common.redemptions"), render: (r) => number(r.total_redemptions) },
            { key: "total_revenue", label: t("common.revenue"), render: (r) => currency(r.total_revenue) }
          ]}
        />
        <DonutChart title={t("dashboard.redemptionsByCity")} data={cities.data} />
      </div>
    </>
  );
}
