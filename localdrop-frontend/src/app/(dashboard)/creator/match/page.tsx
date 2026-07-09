"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BadgeIndianRupee, Building2, Check, Clock3, Flame, Home, Layers, MapPin, QrCode, Radar, ShieldCheck, Sparkles, Store, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, currency } from "@/lib/utils";
import { useCreatorMatches, useCreatorsList, useCreateMatchCampaign, useJoinCampaign } from "@/hooks/use-api";
import { toast } from "sonner";
import { useI18n } from "@/i18n/provider";
import { LanguageToggle } from "@/components/i18n/language-toggle";

// Dynamically load Leaflet Map to avoid SSR errors
const LeafletMap = dynamic(() => import("@/components/dashboard/LeafletMap"), { ssr: false });

export default function MatchMapPage() {
  const { t } = useI18n();
  const { data: dbCreators, isLoading: loadingCreators } = useCreatorsList();
  const [creatorId, setCreatorId] = useState<string>("");

  // Set initial creator when database loads
  useEffect(() => {
    if (dbCreators && dbCreators.length > 0 && !creatorId) {
      setCreatorId(dbCreators[0].id);
    }
  }, [dbCreators, creatorId]);

  const { data: dbMatches, isLoading: loadingMatches } = useCreatorMatches(creatorId || undefined);
  const joinCampaignMutation = useJoinCampaign();
  const createCampaignMutation = useCreateMatchCampaign();

  const [layers, setLayers] = useState({
    audience: false,
    businesses: true,
    geofence: true,
    heat: true,
    home: false
  });

  const layerIcons = {
    audience: Users,
    businesses: Store,
    geofence: Radar,
    heat: Flame,
    home: Home
  };

  const creator = useMemo(() => {
    if (!dbCreators) return null;
    return dbCreators.find((item) => item.id === creatorId) || dbCreators[0] || null;
  }, [dbCreators, creatorId]);

  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  const selectedBusiness = useMemo(() => {
    if (!dbMatches || dbMatches.length === 0) return null;
    if (selectedBusinessId) {
      return dbMatches.find(b => b.id === selectedBusinessId) || dbMatches[0];
    }
    return dbMatches[0];
  }, [dbMatches, selectedBusinessId]);

  // Reset selected business when changing creator
  const handleCreatorChange = (id: string) => {
    setCreatorId(id);
    setSelectedBusinessId(null);
  };

  // Predictive Footfall AI calculations
  const prediction = useMemo(() => {
    if (!selectedBusiness || !creator) return null;
    const score = selectedBusiness.score || 70;
    const visitors = Math.round(score * 1.26);
    
    const categoryLower = (selectedBusiness.category || "cafe").toLowerCase();
    let aov = 375;
    if (categoryLower.includes("street") || categoryLower.includes("food")) {
      aov = 150;
    } else if (categoryLower.includes("tea") || categoryLower.includes("chai")) {
      aov = 90;
    } else if (categoryLower.includes("clothing") || categoryLower.includes("fashion")) {
      aov = 1250;
    }
    const revenue = visitors * aov;
    
    const businessTypeTranslated = t(`category.${categoryLower}` as any) || categoryLower;

    return {
      visitors,
      revenue,
      text: t("match.predictionText", {
        creator: creator.name,
        visitors: String(visitors),
        revenue: currency(revenue),
        businessType: businessTypeTranslated
      })
    };
  }, [selectedBusiness, creator, t]);

  const loadingMatchesIndicator = loadingMatches ? (
    <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-[1000] rounded-lg">
      <p className="text-sm font-semibold text-primary animate-pulse flex items-center gap-2">
        <Radar className="h-4 w-4 animate-spin" /> {t("match.computingMatches")}
      </p>
    </div>
  ) : null;

  if (loadingCreators || !creator) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground animate-pulse">{t("match.loadingCreatorProfiles")}</p>
      </div>
    );
  }

  const clusters = creator.clusters || [];
  const businesses = dbMatches || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">{t("match.creatorBusinessMatchMap")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{t("match.indoreLiveDemo")}</Badge>
            <Badge tone="amber">{t("match.rupeesPerWalkIn")}</Badge>
          </div>
          <LanguageToggle />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_1fr_340px]">
        {/* Creator Selector Card */}
        <Card className="flex flex-col h-full max-h-[682px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />{t("match.creators")}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
              {dbCreators?.map((item) => (
                <button
                  className={cn(
                    "w-full rounded-xl p-3.5 text-left transition flex flex-col gap-1 border", 
                    creator.id === item.id 
                      ? "border-primary bg-card/60 shadow-sm" 
                      : "border-transparent hover:bg-muted/30"
                  )}
                  key={item.id}
                  onClick={() => handleCreatorChange(item.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <p className="font-semibold text-sm text-foreground">{item.name}</p>
                    {creator.id === item.id ? <Check className="h-4 w-4 text-primary shrink-0" /> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.niche}</p>
                  <p className="text-[11px] text-muted-foreground">Indore</p>
                </button>
              ))}
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 shrink-0">
              <p className="text-sm font-semibold">{t("match.demoMath")}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-normal">{t("match.demoMathFormula")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Map Card */}
        <Card className="overflow-hidden relative">
          <CardContent className="p-0 relative">
            {loadingMatchesIndicator}
            
            <div className="relative min-h-[620px] w-full [&_.leaflet-top.leaflet-left]:!mt-20">
              {/* Indore Audience Map Floating Overlay */}
              <div className="absolute left-4 top-4 z-[999] bg-card/90 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-border shadow-sm flex items-center gap-2.5">
                <MapPin className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                <div className="flex flex-col leading-none">
                  <span className="text-xs font-bold text-foreground">Indore</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">audience map</span>
                </div>
              </div>

              {/* Layer Toggles Floating Overlay */}
              <div className="absolute right-4 top-4 z-[999] flex flex-col items-end gap-2">
                <div className="flex gap-1.5">
                  {["businesses", "geofence"].map((key) => {
                    const value = layers[key as keyof typeof layers];
                    return (
                      <Button
                        className={cn(
                          "h-8 rounded-lg px-3 text-xs shadow-sm font-semibold",
                          value 
                            ? "bg-blue-700 hover:bg-blue-800 text-white border-blue-700" 
                            : "bg-background/90 text-muted-foreground border border-border hover:bg-muted"
                        )}
                        key={key}
                        size="sm"
                        onClick={() => setLayers((current) => ({ ...current, [key]: !current[key as keyof typeof current] }))}
                      >
                        <Layers className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                        {key}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex gap-1.5">
                  {["heat"].map((key) => {
                    const value = layers[key as keyof typeof layers];
                    return (
                      <Button
                        className={cn(
                          "h-8 rounded-lg px-3 text-xs shadow-sm font-semibold",
                          value 
                            ? "bg-blue-700 hover:bg-blue-800 text-white border-blue-700" 
                            : "bg-background/90 text-muted-foreground border border-border hover:bg-muted"
                        )}
                        key={key}
                        size="sm"
                        onClick={() => setLayers((current) => ({ ...current, [key]: !current[key as keyof typeof current] }))}
                      >
                        <Layers className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                        {key}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <LeafletMap 
                clusters={clusters}
                businesses={businesses}
                layers={layers}
                selectedBusiness={selectedBusiness}
                onSelectBusiness={(biz) => setSelectedBusinessId(biz.id)}
              />

              {selectedBusiness && (
                <div className="absolute right-4 top-28 w-[290px] rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-4 shadow-xl z-[999] transition duration-200">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground text-sm">{selectedBusiness.name}</p>
                    <span className="text-xs font-bold text-muted-foreground">{selectedBusiness.score}/100</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedBusiness.category} in {selectedBusiness.area}</p>
                  <p className="mt-3 text-xs text-muted-foreground italic">"{selectedBusiness.reason}"</p>

                  <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 border border-border/80 bg-muted/40 rounded-xl flex flex-col gap-0.5">
                      <span className="text-muted-foreground font-medium">{t("match.distance")}</span>
                      <strong className="text-foreground text-sm">{selectedBusiness.distance}</strong>
                    </div>
                    <div className="p-2.5 border border-border/80 bg-muted/40 rounded-xl flex flex-col gap-0.5">
                      <span className="text-muted-foreground font-medium">{t("common.redemptions")}</span>
                      <strong className="text-foreground text-sm">{selectedBusiness.redemptions}</strong>
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{t("match.matchingSignals")}</p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>{t("match.geoOverlap")}</span>
                        <strong className="text-foreground">{selectedBusiness.signals?.geo ?? 0}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("match.nicheMatch")}</span>
                        <strong>{selectedBusiness.signals?.content ?? 0}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("match.pastConversion")}</span>
                        <strong>{selectedBusiness.signals?.conversion ?? 0}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("match.offerAffinity")}</span>
                        <strong>{selectedBusiness.signals?.affinity ?? 0}%</strong>
                      </div>
                    </div>
                  </div>

                  {selectedBusiness.active ? (
                    selectedBusiness.already_joined ? (
                      <Button className="mt-4 w-full h-9" size="sm" disabled>
                        <Check className="mr-2 h-4 w-4" /> {t("match.joinedCampaign")}
                      </Button>
                    ) : (
                      <Button 
                        className="mt-4 w-full h-9" 
                        size="sm"
                        disabled={joinCampaignMutation.isPending}
                        onClick={async () => {
                          if (selectedBusiness.campaign_id) {
                            try {
                              await joinCampaignMutation.mutateAsync(selectedBusiness.campaign_id);
                              toast.success(t("toast.campaignJoinSuccess"));
                            } catch (e) {
                              toast.error(t("toast.campaignJoinFailed"));
                            }
                          }
                        }}
                      >
                        <QrCode className="mr-2 h-4 w-4" /> {t("action.joinCampaign")}
                      </Button>
                    )
                  ) : null}
                </div>
              )}

              <div className="absolute bottom-4 left-4 grid gap-2 rounded-lg border bg-card/95 backdrop-blur-sm p-3 text-xs shadow-sm sm:grid-cols-2 z-[999]">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#5dcaa5]" />{t("match.audienceZones")}</span>
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#0f6e56]" />{t("match.strongMatch")}</span>
                <span className="flex items-center gap-2"><span className="h-3 w-3 border border-[#d85a30] rounded-full" />{t("match.geofence")}</span>
                <span className="flex items-center gap-2"><span className="h-3 w-8 rounded bg-gradient-to-r from-[#faeeda] to-[#d85a30]" />{t("match.redemptionLegend")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info & Metrics Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Radar className="h-4 w-4" />{t("match.topMatches")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingMatches ? (
                <p className="text-sm text-muted-foreground animate-pulse">{t("match.analyzingBusinesses")}</p>
              ) : businesses.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("match.noMatches")}</p>
              ) : (
                businesses.slice(0, 5).map((business) => (
                  <button 
                    className={cn(
                      "w-full rounded-xl p-3 text-left transition flex flex-col gap-1.5 border", 
                      selectedBusiness?.id === business.id 
                        ? "border-primary bg-card/60 shadow-sm" 
                        : "border-border/60 bg-muted/10 hover:bg-muted/30"
                    )} 
                    key={business.id} 
                    onClick={() => setSelectedBusinessId(business.id)}
                  >
                    <div className="flex items-center justify-between w-full gap-3">
                      <p className="font-semibold text-sm text-foreground">{business.name}</p>
                      <span className="text-sm font-semibold text-muted-foreground shrink-0">{business.score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-normal">{business.reason}</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" />{t("match.campaignReady")}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedBusiness?.active ? (
                <>
                  <div className="grid place-items-center rounded-lg border bg-muted/30 p-5">
                    <QrCode className="h-20 w-20 text-foreground" />
                    <p className="mt-4 text-center text-sm font-semibold">{t("match.freeMasalaChai")}</p>
                    <p className="mt-1 text-center text-xs text-muted-foreground">{t("match.expiresIn48h", { name: selectedBusiness.name })}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded border p-2"><Flame className="mx-auto h-4 w-4 text-orange-600" /><strong>{selectedBusiness.redemptions || 0}</strong><p className="text-xs text-muted-foreground">{t("common.redemptions")}</p></div>
                    <div className="rounded border p-2"><BadgeIndianRupee className="mx-auto h-4 w-4 text-emerald-600" /><strong>Rs{selectedBusiness.redemptions * 32 || 0}</strong><p className="text-xs text-muted-foreground">{t("match.earned")}</p></div>
                    <div className="rounded border p-2"><Clock3 className="mx-auto h-4 w-4 text-violet-600" /><strong>48h</strong><p className="text-xs text-muted-foreground">{t("match.window")}</p></div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("match.noActiveCampaign")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" />{t("match.fraudGuard")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Building2 className="mt-0.5 h-4 w-4 text-[#d85a30] shrink-0" />
                <p>{t("match.fraudRule")}</p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
                <p>{t("match.velocityRule")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
