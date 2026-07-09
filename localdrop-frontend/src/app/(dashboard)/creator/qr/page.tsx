"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Download, Link as LinkIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Topbar } from "@/components/dashboard/sidebar";
import { useCreatorCampaigns, useCreatorQR } from "@/hooks/use-api";
import { currency, number } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

export default function CreatorQRPage() {
  const { t } = useI18n();
  const search = useSearchParams();
  const campaigns = useCreatorCampaigns();
  const initial = search.get("campaign") || undefined;
  const [campaignId, setCampaignId] = useState(initial);
  const selected = useMemo(() => campaigns.data?.find((c) => c.id === (campaignId || campaigns.data?.[0]?.id)), [campaignId, campaigns.data]);
  const qr = useCreatorQR(selected?.id);

  const handleDownload = () => {
    if (!qr.data?.qr_data_url) {
      toast.error(t("toast.imageUploadFailed") || "No QR code available");
      return;
    }
    const link = document.createElement("a");
    link.href = qr.data.qr_data_url;
    link.download = `campaign-qr-${selected?.id || "code"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t("toast.qrDownloaded"));
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        toast.success(t("toast.linkCopied"));
      } else {
        toast.error("Failed to copy link");
      }
    } catch (err) {
      toast.error("Failed to copy link");
    }
    document.body.removeChild(textArea);
  };

  const handleCopyLink = () => {
    if (!qr.data?.qr_link) {
      toast.error("No link available to copy");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(qr.data.qr_link)
        .then(() => {
          toast.success(t("toast.linkCopied"));
        })
        .catch(() => {
          fallbackCopyText(qr.data.qr_link);
        });
    } else {
      fallbackCopyText(qr.data.qr_link);
    }
  };

  const handleShare = async () => {
    if (!qr.data?.qr_link) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: selected?.offer_details || "Campaign QR",
          url: qr.data.qr_link,
        });
      } catch (e) {
        // user cancelled or error, do nothing
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <>
      <Topbar title={t("dashboard.myCampaignQr")} />
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader><CardTitle>{t("dashboard.selectCampaign")}</CardTitle></CardHeader>
          <CardContent>
            <Select value={selected?.id || ""} onChange={(e) => setCampaignId(e.target.value)}>
              {campaigns.data?.map((c) => <option key={c.id} value={c.id}>{c.offer_details}</option>)}
            </Select>
            {selected ? <div className="mt-4 text-sm text-muted-foreground">{selected.business_name} - {selected.status}</div> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{selected?.offer_details || t("dashboard.campaignQr")}</CardTitle></CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <div className="grid place-items-center rounded-lg border bg-white p-5 max-w-full overflow-hidden">
              {qr.data?.qr_data_url ? <img className="h-64 w-64" src={qr.data.qr_data_url} alt={t("dashboard.campaignQr")} /> : <div className="grid h-64 w-64 place-items-center bg-muted text-sm text-muted-foreground">{t("dashboard.qrLoadsAfterJoin")}</div>}
              <p className="mt-4 rounded bg-primary/10 px-3 py-2 text-sm text-primary break-all max-w-full text-center">{qr.data?.qr_link}</p>
            </div>
            <div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label={t("dashboard.shares")} value={number(qr.data?.scan_count)} />
                <Stat label={t("common.claims")} value={number(qr.data?.claim_count)} />
                <Stat label={t("common.earnings")} value={currency(selected?.my_earnings)} />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleDownload}><Download className="h-4 w-4" />{t("action.downloadQr")}</Button>
                <Button variant="outline" onClick={handleCopyLink}><LinkIcon className="h-4 w-4" />{t("action.copyLink")}</Button>
                <Button onClick={handleShare}><Share2 className="h-4 w-4" />{t("action.share")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
}
