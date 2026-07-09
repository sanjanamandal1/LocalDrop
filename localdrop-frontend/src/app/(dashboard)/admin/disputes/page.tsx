"use client";

import { useQuery } from "@tanstack/react-query";
import { Topbar } from "@/components/dashboard/sidebar";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/lib/services";
import { currency, dateLabel } from "@/lib/utils";

export default function AdminDisputesPage() {
  const disputes = useQuery({ queryKey: ["admin-disputes"], queryFn: adminService.disputes });
  return (
    <>
      <Topbar title="Disputes" />
      <DataTable<any>
        rows={disputes.data}
        columns={[
          { key: "business_name", label: "Business" },
          { key: "creator_name", label: "Creator" },
          { key: "campaign_name", label: "Campaign" },
          { key: "earning_amount", label: "Amount", render: (r) => currency(r.earning_amount) },
          { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
          { key: "filed_at", label: "Filed", render: (r) => dateLabel(r.filed_at) },
        ]}
      />
    </>
  );
}
