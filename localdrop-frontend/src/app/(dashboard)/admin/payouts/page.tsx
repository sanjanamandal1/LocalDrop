"use client";

import { useQuery } from "@tanstack/react-query";
import { Topbar } from "@/components/dashboard/sidebar";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/lib/services";
import { currency, dateLabel } from "@/lib/utils";

export default function AdminPayoutsPage() {
  const payouts = useQuery({ queryKey: ["admin-payouts"], queryFn: adminService.pendingPayouts });
  return (
    <>
      <Topbar title="Pending Payouts" />
      <DataTable<any>
        rows={payouts.data}
        columns={[
          { key: "creator_name", label: "Creator" },
          { key: "creator_email", label: "Email" },
          { key: "amount", label: "Amount", render: (r) => currency(r.amount) },
          { key: "payout_method", label: "Method" },
          { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
          { key: "requested_at", label: "Requested", render: (r) => dateLabel(r.requested_at) },
        ]}
      />
    </>
  );
}
