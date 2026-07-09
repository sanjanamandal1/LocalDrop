"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/dashboard/sidebar";
import { DataTable } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/lib/services";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users"], queryFn: adminService.users });
  const status = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminService.setUserStatus(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  return (
    <>
      <Topbar title="Users" />
      <DataTable<any>
        rows={users.data}
        columns={[
          { key: "display_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "city", label: "City" },
          { key: "is_active", label: "Status", render: (r) => <Badge tone={r.is_active ? "green" : "red"}>{r.is_active ? "active" : "suspended"}</Badge> },
          { key: "action", label: "Action", render: (r) => <Button size="sm" variant={r.is_active ? "outline" : "primary"} onClick={() => status.mutate({ id: r.id, is_active: !r.is_active })}>{r.is_active ? "Suspend" : "Activate"}</Button> },
        ]}
      />
    </>
  );
}
