"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/table";
import { Topbar } from "@/components/dashboard/sidebar";
import { analyticsService } from "@/lib/services";
import { currency, dateLabel } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import type { Redemption } from "@/types/api";

export default function BusinessRedemptionsPage() {
  const { t } = useI18n();
  const redemptions = useQuery({ queryKey: ["business-redemptions"], queryFn: analyticsService.businessRedemptions });
  return (
    <>
      <Topbar title={t("nav.redemptions")} action={<Link href="/business/redeem"><Button>{t("action.scanRedeem")}</Button></Link>} />
      <DataTable<Redemption>
        rows={redemptions.data}
        columns={[
          { key: "confirmed_at", label: t("common.time"), render: (r) => dateLabel(r.confirmed_at) },
          { key: "customer_name", label: t("common.customer") },
          { key: "creator_name", label: t("common.creator") },
          { key: "campaign_name", label: t("common.campaign") },
          { key: "commission_amount", label: t("common.amount"), render: (r) => currency(r.commission_amount) },
          { key: "status", label: t("common.status"), render: (r) => <Badge>{r.status}</Badge> }
        ]}
      />
    </>
  );
}
