"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Topbar } from "@/components/dashboard/sidebar";
import { useJoinCampaign, useNearbyCampaigns } from "@/hooks/use-api";
import { currency, dateLabel } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { assetUrl } from "@/lib/assetUrl";
import type { Campaign } from "@/types/api";

function getFallbackGradient(type: string): string {
  const gradients: Record<string, string> = {
    discount: "from-rose-500 to-orange-500",
    bogo: "from-amber-500 to-yellow-500",
    freebie: "from-emerald-500 to-teal-500",
    cashback: "from-indigo-500 to-blue-500",
  };
  return gradients[type] || "from-purple-500 to-pink-500";
}

export default function AvailableCampaignsPage() {
  const { t } = useI18n();
  const [lat, setLat] = useState("22.7196");
  const [lng, setLng] = useState("75.8577");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const campaigns = useNearbyCampaigns(Number(lat), Number(lng));
  const join = useJoinCampaign();

  return (
    <>
      <Topbar title={t("dashboard.availableCampaigns")} />
      <div className="mb-5 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_1fr_auto]">
        <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder={t("common.latitude")} />
        <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder={t("common.longitude")} />
        <Button onClick={() => campaigns.refetch()}>{t("action.searchNearby")}</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {campaigns.data?.map((campaign: Campaign) => (
          <motion.div
            key={campaign.id}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card>
            <CardContent className="p-4">
              {campaign.image_url && !imageErrors[campaign.id] ? (
                <img
                  className="h-36 w-full rounded-lg object-cover"
                  src={assetUrl(campaign.image_url)}
                  alt={campaign.name}
                  onError={() => setImageErrors((prev) => ({ ...prev, [campaign.id]: true }))}
                />
              ) : (
                <div className={`h-36 rounded-lg bg-gradient-to-br ${getFallbackGradient(campaign.campaign_type)} flex flex-col items-center justify-center text-white p-4 shadow-inner`}>
                  <span className="text-base font-bold text-center line-clamp-2 max-w-full drop-shadow-sm">{campaign.name}</span>
                  <span className="text-[10px] uppercase tracking-wider mt-2 px-2 py-0.5 bg-black/25 rounded-full font-semibold">{campaign.campaign_type}</span>
                </div>
              )}
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{campaign.offer_details}</h2>
                  <p className="text-sm text-muted-foreground">{campaign.business_name} - {t("dashboard.distanceAway", { distance: campaign.distance_km ?? "" })}</p>
                </div>
                <Badge>{campaign.campaign_type}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex justify-between"><span>{t("common.commission")}</span><strong>{campaign.commission_type === "fixed" ? currency(campaign.commission_value) : `${campaign.commission_value}%`}</strong></p>
                <p className="flex justify-between"><span>{t("common.validTill")}</span><strong>{dateLabel(campaign.valid_till)}</strong></p>
              </div>
              <Button className="mt-4 w-full" disabled={campaign.already_joined || join.isPending} onClick={() => join.mutate(campaign.id)}>{campaign.already_joined ? t("dashboard.joined") : t("action.joinCampaign")}</Button>
            </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </>
  );
}
