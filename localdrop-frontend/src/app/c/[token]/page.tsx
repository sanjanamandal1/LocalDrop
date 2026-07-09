"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { qrService } from "@/lib/services";
import { apiError } from "@/lib/api";
import { dateLabel } from "@/lib/utils";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { useI18n } from "@/i18n/provider";
import { assetUrl } from "@/lib/assetUrl";

function getFallbackAccent(type: string): string {
  const accents: Record<string, string> = {
    discount: "bg-[var(--ld-red)]",
    bogo: "bg-[var(--ld-amber)]",
    freebie: "bg-[var(--ld-mint)]",
    cashback: "bg-[var(--ld-sky)]",
  };
  return accents[type] || "bg-[var(--ld-pink)]";
}

export default function PublicClaimPage() {
  const { t } = useI18n();
  const params = useParams<{ token: string }>();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [claimLat, setClaimLat] = useState<number | null>(null);
  const [claimLng, setClaimLng] = useState<number | null>(null);
  const [claimAccuracy, setClaimAccuracy] = useState<number | null>(null);
  const [fingerprint, setFingerprint] = useState("");
  const [imageError, setImageError] = useState(false);

  const scan = useQuery({ queryKey: ["scan", params.token], queryFn: () => qrService.scan(params.token) });
  const claim = useMutation({ mutationFn: qrService.claim });

  useEffect(() => {
    let fp = localStorage.getItem("localdrop_fingerprint");
    if (!fp) {
      fp = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("localdrop_fingerprint", fp);
    }
    setFingerprint(fp);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setClaimLat(pos.coords.latitude);
          setClaimLng(pos.coords.longitude);
          setClaimAccuracy(pos.coords.accuracy);
        },
        (err) => {
          console.warn("Geolocation access denied or failed:", err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  return (
    <main className="ld-app-shell relative grid min-h-screen place-items-center overflow-hidden px-4 py-8 text-foreground">
      <div className="ld-app-grid absolute inset-0 pointer-events-none" />

      <Card className="z-10 w-full max-w-sm overflow-hidden bg-card">
        <CardContent className="p-0">
          {scan.data?.image_url && !imageError ? (
            <img
              className="h-44 w-full object-cover"
              src={assetUrl(scan.data.image_url)}
              alt=""
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={`flex h-44 flex-col items-center justify-center border-b-2 border-[var(--ld-ink)] p-4 text-[#08050f] ${getFallbackAccent(scan.data?.campaign_type || "")}`}>
              <span className="line-clamp-2 max-w-full text-center text-xl font-black">{scan.data?.campaign_name || ""}</span>
              <span className="mt-2.5 rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-surface)] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider shadow-[2px_3px_0_var(--ld-ink)]">{scan.data?.campaign_type || ""}</span>
            </div>
          )}
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-lg font-black"><MapPin className="h-5 w-5 text-primary" />LocalDrop</div>
              <div className="flex items-center gap-3">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
            {scan.isLoading ? <p className="text-sm text-muted-foreground">{t("dashboard.loadingOffer")}</p> : null}
            {scan.error ? <p className="text-sm text-red-600">{apiError(scan.error)}</p> : null}
            {scan.data && !claim.data ? (
              <>
                <p className="text-sm font-black uppercase tracking-[0.08em] text-muted-foreground">{scan.data.business_name}</p>
                <h1 className="mt-1 text-2xl font-black text-primary">{scan.data.offer_details}</h1>
                <p className="mt-3 text-sm font-semibold text-muted-foreground">{t("dashboard.createdByValidTill", { creator: scan.data.creator_name, date: dateLabel(scan.data.valid_till) })}</p>

                {claimLat == null && (
                  <p className="mt-3 rounded-[14px] border-2 border-[var(--ld-ink)] bg-[var(--ld-amber)] px-3 py-2 text-xs font-black text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">
                    {t("dashboard.locationRecommended")}
                  </p>
                )}

                <div className="mt-5 space-y-3">
                  <Input placeholder={t("dashboard.yourName")} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <Input placeholder={t("dashboard.phoneNumber")} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  <Button
                    className="w-full"
                    onClick={() => claim.mutate({
                      qr_token: params.token,
                      customer_name: customerName,
                      customer_phone: customerPhone,
                      claim_lat: claimLat ?? undefined,
                      claim_lng: claimLng ?? undefined,
                      claim_accuracy: claimAccuracy ?? undefined,
                      device_fingerprint: fingerprint || undefined
                    })}
                  >
                    {t("action.claimOffer")}
                  </Button>
                </div>
              </>
            ) : null}
            {claim.error ? <p className="mt-4 text-sm text-red-600">{apiError(claim.error)}</p> : null}
            {claim.data ? (
              <div className="text-center">
                <CheckCircle className="mx-auto h-14 w-14 text-[var(--ld-mint)]" />
                <h1 className="mt-3 text-2xl font-black">{t("dashboard.offerClaimed")}</h1>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">{t("dashboard.showQrCounter")}</p>
                {claim.data.redemption_qr ? <img className="mx-auto mt-5 h-56 w-56" src={claim.data.redemption_qr} alt={t("dashboard.campaignQr")} /> : null}
                <p className="mt-3 rounded-[14px] border-2 border-[var(--ld-ink)] bg-[var(--ld-lime)] px-3 py-2 text-sm font-black text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">{t("dashboard.redemptionId", { id: String(claim.data.redemption_code) })}</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
