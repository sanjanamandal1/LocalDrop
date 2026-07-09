"use client";

import { useQuery } from "@tanstack/react-query";
import { Topbar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminService } from "@/lib/services";
import { number, currency } from "@/lib/utils";

export default function AdminPage() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: adminService.stats });
  const data = stats.data || {};
  return (
    <>
      <Topbar title="Admin Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat title="Creators" value={number(data.total_creators)} />
        <Stat title="Businesses" value={number(data.total_businesses)} />
        <Stat title="Active Campaigns" value={number(data.active_campaigns)} />
        <Stat title="Open Disputes" value={number(data.open_disputes)} />
        <Stat title="Confirmed Redemptions" value={number(data.total_redemptions)} />
        <Stat title="Platform Earnings" value={currency(data.total_earnings_platform)} />
        <Stat title="Paid Out" value={currency(data.total_paid_out)} />
        <Stat title="Total Campaigns" value={number(data.total_campaigns)} />
      </div>
    </>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p></CardContent></Card>;
}
