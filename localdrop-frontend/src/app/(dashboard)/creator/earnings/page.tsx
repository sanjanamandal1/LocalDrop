"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, IndianRupee, QrCode, WalletCards } from "lucide-react";
import { Topbar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimelineChart } from "@/components/dashboard/charts";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCreatorEarningsData, useCreatorPayoutData } from "@/hooks/use-api";
import { payoutService } from "@/lib/services";
import { apiError } from "@/lib/api";
import { currency, dateLabel, number } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

export default function CreatorEarningsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { earnings, timeline, byCampaign } = useCreatorEarningsData();
  const { eligibility, payouts } = useCreatorPayoutData();
  const request = useMutation({
    mutationFn: payoutService.request,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payout-eligibility"] });
      qc.invalidateQueries({ queryKey: ["creator-payouts"] });
      qc.invalidateQueries({ queryKey: ["creator-earnings"] });
    }
  });
  const summary = earnings.data?.summary;
  return (
    <>
      <Topbar
        title="Money"
        action={<Button disabled={!eligibility.data?.is_eligible || request.isPending} onClick={() => request.mutate()}>{t("action.requestPayout")}</Button>}
      />
      <div className="mb-5 rounded-[24px] border-2 border-[var(--ld-ink)] bg-[var(--ld-mint)] p-5 text-[#08050f] shadow-[6px_7px_0_var(--ld-ink)]">
        <p className="text-xs font-black uppercase tracking-[0.12em]">Creator wallet</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Track earnings, payout eligibility, requests, and campaign performance together.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={IndianRupee} label={t("dashboard.totalEarnings")} value={currency(summary?.total_earned)} />
        <StatCard icon={WalletCards} label={t("common.available")} value={currency(eligibility.data?.available_amount ?? summary?.available_amount)} tone="green" />
        <StatCard icon={WalletCards} label={t("common.pending")} value={currency(summary?.pending_amount)} tone="blue" />
        <StatCard icon={CreditCard} label={t("dashboard.minimumPayout")} value={currency(eligibility.data?.minimum_payout)} tone="blue" />
        <StatCard icon={QrCode} label={t("dashboard.paidCount")} value={number(summary?.paid_count)} tone="amber" />
      </div>
      {(eligibility.data?.reason || request.error) ? (
        <p className="mt-5 rounded-[18px] border-2 border-[var(--ld-ink)] bg-[var(--ld-amber)] p-4 text-sm font-black text-[#08050f] shadow-[4px_5px_0_var(--ld-ink)]">
          {request.error ? apiError(request.error) : eligibility.data?.reason}
        </p>
      ) : null}
      <div className="mt-5"><TimelineChart title={t("dashboard.earningsOverTime")} data={timeline.data} valueKey="amount" /></div>
      <div className="mt-5">
        <DataTable<Record<string, string | number | null>>
          rows={earnings.data?.earnings}
          columns={[
            { key: "campaign_name", label: t("common.campaign") },
            { key: "business_name", label: t("common.business") },
            { key: "amount", label: t("common.amount"), render: (r) => currency(r.amount) },
            { key: "status", label: t("common.status"), render: (r) => <Badge tone={r.status === "paid" ? "green" : "amber"}>{r.status}</Badge> },
            { key: "confirmed_at", label: t("common.confirmed"), render: (r) => dateLabel(String(r.confirmed_at || "")) }
          ]}
        />
      </div>
      <div className="mt-5">
        <DataTable<Record<string, string | number | null>>
          rows={payouts.data?.payouts}
          columns={[
            { key: "requested_at", label: t("common.date"), render: (r) => dateLabel(String(r.requested_at || "")) },
            { key: "amount", label: t("common.amount"), render: (r) => currency(r.amount) },
            { key: "payout_method", label: t("common.method") },
            { key: "utr_number", label: t("common.transactionId") },
            { key: "status", label: t("common.status"), render: (r) => <Badge tone={r.status === "paid" ? "green" : "amber"}>{r.status}</Badge> }
          ]}
        />
      </div>
      <div className="mt-5">
        <DataTable rows={byCampaign.data} columns={[
          { key: "campaign_name", label: t("common.campaign") },
          { key: "business_name", label: t("common.business") },
          { key: "redemptions", label: t("common.redemptions"), render: (r) => number(r.redemptions) },
          { key: "total_earnings", label: t("common.earnings"), render: (r) => currency(r.total_earnings) }
        ]} />
      </div>
    </>
  );
}
