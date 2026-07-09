"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table";
import { Topbar } from "@/components/dashboard/sidebar";
import { useCreatorCampaigns } from "@/hooks/use-api";
import { currency, number } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import type { Campaign } from "@/types/api";

export default function JoinedCampaignsPage() {
  const { t } = useI18n();
  const campaigns = useCreatorCampaigns();
  return (
    <>
      <Topbar title={t("dashboard.joinedCampaigns")} />
      <DataTable<Campaign>
        rows={campaigns.data}
        columns={[
          { key: "name", label: t("common.campaign") },
          { key: "business_name", label: t("common.business") },
          { key: "status", label: t("common.status"), render: (r) => <Badge>{r.status}</Badge> },
          { key: "scan_count", label: t("common.qrViews"), render: (r) => number(r.scan_count) },
          { key: "claim_count", label: t("common.claims"), render: (r) => number(r.claim_count) },
          { key: "my_earnings", label: t("common.earnings"), render: (r) => currency(r.my_earnings) },
          { key: "action", label: t("common.action"), render: (r) => <Link href={`/creator/qr?campaign=${r.id}`}><Button size="sm" variant="outline">{t("action.openQr")}</Button></Link> }
        ]}
      />
    </>
  );
}
