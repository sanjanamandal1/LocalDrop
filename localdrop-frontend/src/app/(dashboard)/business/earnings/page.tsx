"use client";

import { CreditCard, IndianRupee, QrCode, User, WalletCards } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Topbar } from "@/components/dashboard/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { earningsService } from "@/lib/services";
import { useBusinessDashboardData } from "@/hooks/use-api";
import { currency, number, pct } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import type { CampaignStat } from "@/types/api";

export default function BusinessEarningsPage() {
  const { t } = useI18n();
  const business = useQuery({ queryKey: ["business-earnings"], queryFn: earningsService.business });
  const { campaigns } = useBusinessDashboardData();
  return (
    <>
      <Topbar title="Money" />
      <div className="mb-5 rounded-[24px] border-2 border-[var(--ld-ink)] bg-[var(--ld-lime)] p-5 text-[#08050f] shadow-[6px_7px_0_var(--ld-ink)]">
        <p className="text-xs font-black uppercase tracking-[0.12em]">Brand finance center</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Revenue, creator liabilities, and campaign spend in one place.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={IndianRupee} label={t("dashboard.totalPaidOut")} value={currency(business.data?.total_paid_out)} />
        <StatCard icon={WalletCards} label={t("dashboard.pendingAmount")} value={currency(business.data?.pending_amount)} tone="blue" />
        <StatCard icon={CreditCard} label={t("dashboard.availableAmount")} value={currency(business.data?.available_amount)} tone="green" />
        <StatCard icon={QrCode} label={t("dashboard.totalRedemptions")} value={number(business.data?.total_redemptions)} tone="green" />
        <StatCard icon={User} label={t("dashboard.uniqueCreators")} value={number(business.data?.unique_creators)} tone="amber" />
      </div>
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>{t("dashboard.payoutDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm font-semibold text-muted-foreground md:grid-cols-[1.2fr_0.8fr]">
          <p>{t("dashboard.payoutDetailsBody")}</p>
          <div className="rounded-[18px] border-2 border-[var(--ld-ink)] bg-[var(--ld-cream)] p-4 text-foreground shadow-[4px_5px_0_var(--ld-ink)]">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">Current liability</p>
            <p className="mt-1 text-2xl font-black">{currency(business.data?.pending_amount)}</p>
          </div>
        </CardContent>
      </Card>
      <div className="mt-5">
        <DataTable<CampaignStat>
          rows={campaigns.data}
          columns={[
            { key: "name", label: t("common.campaign") },
            { key: "total_redemptions", label: t("common.redemptions"), render: (r) => number(r.total_redemptions) },
            { key: "total_revenue", label: t("common.revenue"), render: (r) => currency(r.total_revenue) },
            { key: "spent_budget", label: t("common.commissionSpent"), render: (r) => currency((r as unknown as { spent_budget?: string | number }).spent_budget) },
            { key: "conversion_rate", label: t("common.conversion"), render: (r) => pct(r.conversion_rate) }
          ]}
        />
      </div>
    </>
  );
}
