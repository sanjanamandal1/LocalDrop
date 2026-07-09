"use client";

import { useState } from "react";
import { Gift, IndianRupee, QrCode, WalletCards } from "lucide-react";
import { Topbar } from "@/components/dashboard/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { HeatmapCard, TimelineChart } from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCreatorCampaigns, useCreatorDashboardData, useCreatorEarningsData } from "@/hooks/use-api";
import { currency, number } from "@/lib/utils";
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

export default function CreatorDashboard() {
  const { t } = useI18n();
  const { overview } = useCreatorDashboardData();
  const { timeline } = useCreatorEarningsData();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const campaigns = useCreatorCampaigns();
  const top = campaigns.data?.[0];
  return (
    <>
      <Topbar title={t("dashboard.welcomeBack")} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Gift} label={t("dashboard.activeCampaigns")} value={number(overview.data?.total_campaigns_joined)} />
        <StatCard icon={QrCode} label={t("dashboard.totalRedemptions")} value={number(overview.data?.total_redemptions)} tone="green" />
        <StatCard icon={IndianRupee} label={t("dashboard.totalEarnings")} value={currency(overview.data?.total_earnings)} tone="amber" />
        <StatCard icon={WalletCards} label={t("dashboard.pendingPayout")} value={currency(overview.data?.pending_earnings)} tone="blue" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <TimelineChart title={t("dashboard.earningsOverTime")} data={timeline.data} valueKey="amount" />
        <Card>
          <CardHeader><CardTitle>{t("dashboard.topCampaign")}</CardTitle></CardHeader>
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
                <div><h3 className="font-semibold">{top.offer_details}</h3><p className="text-sm text-muted-foreground">{top.business_name}</p></div>
                <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-muted-foreground">{t("common.redemptions")}</p><strong>{number(top.total_redemptions)}</strong></div><div><p className="text-muted-foreground">{t("common.earnings")}</p><strong>{currency(top.my_earnings)}</strong></div></div>
              </div>
            ) : <p className="text-sm text-muted-foreground">{t("dashboard.joinCampaignsPerformance")}</p>}
          </CardContent>
        </Card>
      </div>
      <div className="mt-5">
        <HeatmapCard />
      </div>
      <div className="mt-5">
        <DataTable<Campaign>
          rows={campaigns.data}
          columns={[
            { key: "name", label: t("common.campaign") },
            { key: "business_name", label: t("common.business") },
            { key: "status", label: t("common.status"), render: (r) => <Badge>{r.status}</Badge> },
            { key: "claim_count", label: t("common.claims"), render: (r) => number(r.claim_count) },
            { key: "total_redemptions", label: t("common.redemptions"), render: (r) => number(r.total_redemptions) },
            { key: "my_earnings", label: t("common.earnings"), render: (r) => currency(r.my_earnings) }
          ]}
        />
      </div>
    </>
  );
}
