"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { Topbar } from "@/components/dashboard/sidebar";
import { useBusinessCampaigns, useCampaignStatus } from "@/hooks/use-api";
import { currency, dateLabel, number } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import type { Campaign } from "@/types/api";

export default function BusinessCampaignsPage() {
  const { t } = useI18n();
  const campaigns = useBusinessCampaigns();
  const status = useCampaignStatus();
  return (
    <>
      <Topbar title={t("nav.campaigns")} action={<Link href="/business/campaigns/create"><Button>{t("action.createCampaignPlus")}</Button></Link>} />
      <DataTable<Campaign>
        rows={campaigns.data}
        columns={[
          { key: "name", label: t("common.campaign") },
          { key: "offer_details", label: t("dashboard.offer") },
          { key: "status", label: t("common.status"), render: (r) => <Badge tone={r.status === "active" ? "green" : "gray"}>{r.status}</Badge> },
          { key: "budget", label: t("dashboard.budget"), render: (r) => `${currency(r.spent_budget)} / ${currency(r.total_budget)}` },
          { key: "total_redemptions", label: t("common.redemptions"), render: (r) => number(r.total_redemptions) },
          { key: "valid_till", label: t("common.validTill"), render: (r) => dateLabel(r.valid_till) },
          {
            key: "action",
            label: t("common.action"),
            render: (r) => r.status === "active" ? <Button size="sm" variant="outline" onClick={() => status.mutate({ id: r.id, status: "paused" })}>{t("action.pause")}</Button> : <Button size="sm" onClick={() => status.mutate({ id: r.id, status: "active" })}>{t("action.activate")}</Button>
          }
        ]}
      />
    </>
  );
}
