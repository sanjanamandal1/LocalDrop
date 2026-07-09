"use client";

import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Sector, ReferenceLine } from "recharts";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
import type { TimelinePoint } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function TimelineChart({ title, data, valueKey = "redemptions" }: { title: string; data?: TimelinePoint[]; valueKey?: string }) {
  const { t } = useI18n();
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "all">("all");
  const [showAverage, setShowAverage] = useState(false);

  // Ensure data is sorted chronologically
  const sortedData = [...(data || [])].sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());

  // Filter based on timeframe
  const filteredData = timeframe === "7d" 
    ? sortedData.slice(-7) 
    : timeframe === "30d" 
    ? sortedData.slice(-30) 
    : sortedData;

  const rows = filteredData.map((item) => ({
    ...item,
    label: new Date(item.period).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    value: Number((item as Record<string, unknown>)[valueKey] ?? 0)
  }));

  const total = rows.reduce((sum, item) => sum + item.value, 0);
  const average = rows.length ? total / rows.length : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card/95 backdrop-blur-md p-3 shadow-xl text-xs">
          <p className="font-semibold text-foreground">{label}</p>
          <div className="mt-1 flex items-center gap-1.5 font-bold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>{payload[0].value} {t("common.redemptions")}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <div className="inline-flex rounded-md border border-border bg-background p-0.5 text-[10px]">
            {(["7d", "30d", "all"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`rounded px-2 py-0.5 font-medium transition ${
                  timeframe === tf 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf === "7d" ? "7D" : tf === "30d" ? "30D" : "All"}
              </button>
            ))}
          </div>
          {/* Average Line Toggle */}
          <Button
            size="sm"
            variant="outline"
            className={`h-6 px-2 text-[10px] gap-1 ${showAverage ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""}`}
            onClick={() => setShowAverage(!showAverage)}
          >
            {showAverage ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {t("chart.avgLine")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="label" 
              tickLine={false} 
              axisLine={false} 
              fontSize={11} 
              stroke="currentColor" 
              className="text-muted-foreground"
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              fontSize={11} 
              stroke="currentColor" 
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              fill="url(#purpleFill)" 
              strokeWidth={2}
              activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
            />
            {showAverage && (
              <ReferenceLine 
                y={average} 
                stroke="#10b981" 
                strokeDasharray="4 4" 
                label={{ 
                  value: `${t("chart.average")}: ${Math.round(average)}`, 
                  fill: '#10b981', 
                  fontSize: 10, 
                  position: 'top' 
                }} 
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DonutChart({ title, data }: { title: string; data?: { city?: string; redemptions?: string | number; revenue?: string | number }[] }) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hiddenCities, setHiddenCities] = useState<string[]>([]);

  const processedRows = data?.map((item) => ({
    name: item.city || t("common.unknown"),
    value: Number(item.redemptions ?? 0)
  })) ?? [];

  // Filter out toggled cities
  const rows = processedRows.filter(r => !hiddenCities.includes(r.name));

  const colors = ["#6d28d9", "#10b981", "#f97316", "#ec4899", "#64748b"];

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    );
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card/95 backdrop-blur-md p-2.5 shadow-xl text-xs">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="mt-0.5 font-bold text-primary">{payload[0].value} {t("common.redemptions")}</p>
        </div>
      );
    }
    return null;
  };

  const toggleCity = (cityName: string) => {
    if (hiddenCities.includes(cityName)) {
      setHiddenCities(hiddenCities.filter(c => c !== cityName));
    } else {
      setHiddenCities([...hiddenCities, cityName]);
    }
    setActiveIndex(null);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="h-[220px] relative">
          {rows.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  innerRadius={56} 
                  outerRadius={80} 
                  dataKey="value" 
                  data={rows}
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  animationBegin={0}
                  animationDuration={600}
                >
                  {rows.map((row, index) => {
                    // Find original index to maintain color consistency
                    const origIndex = processedRows.findIndex(pr => pr.name === row.name);
                    return <Cell key={index} fill={colors[origIndex % colors.length]} className="outline-none transition-all duration-300" />;
                  })}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              {t("chart.noCitiesSelected")}
            </div>
          )}
        </div>
        <div className="space-y-2.5 self-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("chart.toggleCities")}</p>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {processedRows.map((row, index) => {
              const isHidden = hiddenCities.includes(row.name);
              const isActive = activeIndex !== null && rows[activeIndex]?.name === row.name;
              return (
                <button
                  type="button"
                  onClick={() => toggleCity(row.name)}
                  onMouseEnter={() => {
                    if (!isHidden) {
                      const idx = rows.findIndex(r => r.name === row.name);
                      if (idx !== -1) setActiveIndex(idx);
                    }
                  }}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex w-full items-center justify-between text-xs rounded px-2 py-1 transition-all ${
                    isHidden 
                      ? "opacity-40 hover:opacity-60 line-through" 
                      : isActive 
                      ? "bg-muted font-semibold" 
                      : "hover:bg-muted/50"
                  }`}
                  key={row.name}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full border border-black/10 dark:border-white/10" style={{ background: colors[index % colors.length] }} />
                    <span className="text-foreground">{row.name}</span>
                  </span>
                  <strong className="text-foreground">{row.value}</strong>
                </button>
              );
            })}
          </div>
          {!processedRows.length ? <p className="text-sm text-muted-foreground">{t("chart.noCityData")}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

const LeafletHeatmap = dynamic(() => import("./LeafletHeatmap"), { ssr: false });

export function HeatmapCard() {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader><CardTitle>{t("chart.audienceHeatmap")}</CardTitle></CardHeader>
      <CardContent>
        <div className="relative h-[320px] overflow-hidden rounded-xl border bg-slate-950">
          <LeafletHeatmap />
          <div className="absolute bottom-4 right-4 z-[999] flex items-center gap-2 rounded bg-slate-900/90 text-white border border-slate-700 px-3 py-2 text-[10px] uppercase font-bold shadow">
            {t("chart.low")} <span className="h-2.5 w-24 rounded bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500" /> {t("chart.high")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
