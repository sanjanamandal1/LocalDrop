"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

export function DataTable<T>({
  columns,
  rows,
  empty
}: {
  columns: { key: string; label: string; render?: (row: T) => ReactNode }[];
  rows?: T[];
  empty?: string;
}) {
  const { t } = useI18n();

  return (
    <div className="glow-border-card overflow-hidden rounded-[24px] bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b-2 border-[var(--ld-ink)] bg-[var(--ld-cream)] text-xs uppercase tracking-[0.08em] text-foreground">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 font-black" key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.length ? (
              rows.map((row, index) => (
                <tr className={cn("border-t-2 border-[rgba(8,5,15,0.18)] transition duration-150 hover:bg-[var(--ld-lime)]/20", index % 2 === 1 && "bg-muted/20")} key={index}>
                  {columns.map((column) => (
                    <td className="px-4 py-3 font-semibold" key={column.key}>{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "-")}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center font-black text-muted-foreground" colSpan={columns.length}>{empty || t("common.noRecords")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
