"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Topbar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { qrService } from "@/lib/services";
import { apiError } from "@/lib/api";
import { currency } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import jsQR from "jsqr";

export default function RedeemPage() {
  const { t } = useI18n();
  const [redemptionCode, setRedemptionCode] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [bizLat, setBizLat] = useState<number | null>(null);
  const [bizLng, setBizLng] = useState<number | null>(null);
  const [bizAccuracy, setBizAccuracy] = useState<number | null>(null);
  const [scannerMessage, setScannerMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const redeem = useMutation({ mutationFn: qrService.redeemManual });
  const redeemById = useMutation({ mutationFn: qrService.redeem });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setBizLat(pos.coords.latitude);
          setBizLng(pos.coords.longitude);
          setBizAccuracy(pos.coords.accuracy);
        },
        (err) => {
          console.warn("Business location access denied/failed:", err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const submitManual = (code = redemptionCode) => {
    redeem.mutate({
      redemption_code: code.trim(),
      bill_amount: Number(billAmount || 0),
      business_lat: bizLat ?? undefined,
      business_lng: bizLng ?? undefined,
      confirm_accuracy: bizAccuracy ?? undefined
    });
  };

  const submitScannedValue = (value: string) => {
    const uuid = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)?.[0];
    if (uuid) {
      redeemById.mutate({
        redemption_id: uuid,
        bill_amount: Number(billAmount || 0),
        business_lat: bizLat ?? undefined,
        business_lng: bizLng ?? undefined,
        confirm_accuracy: bizAccuracy ?? undefined
      });
      setScannerMessage("QR detected. Confirming redemption...");
      stopScanner();
      return;
    }
    setRedemptionCode(value.trim());
    submitManual(value);
    setScannerMessage("Code detected. Confirming redemption...");
    stopScanner();
  };

  const startScanner = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScannerMessage("Camera access requires a secure connection (HTTPS) or localhost.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraActive(true);
      setScannerMessage("Point the camera at the customer's redemption QR.");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      let stopped = false;
      
      const scan = () => {
        if (stopped || !videoRef.current || !streamRef.current) return;
        const video = videoRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const width = video.videoWidth;
          const height = video.videoHeight;
          canvas.width = width;
          canvas.height = height;
          if (context) {
            context.drawImage(video, 0, 0, width, height);
            const imageData = context.getImageData(0, 0, width, height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
              stopped = true;
              submitScannedValue(code.data);
              return;
            }
          }
        }
        animationFrameIdRef.current = requestAnimationFrame(scan);
      };
      
      animationFrameIdRef.current = requestAnimationFrame(scan);
    } catch (err) {
      console.error(err);
      setScannerMessage("Camera permission failed. Use manual code entry below.");
    }
  };

  const stopScanner = () => {
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  return (
    <>
      <Topbar title={t("dashboard.scanRedeemTitle")} />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle>{t("dashboard.scanCustomerQr")}</CardTitle></CardHeader>
          <CardContent>
            <div className="relative grid h-72 place-items-center overflow-hidden rounded-lg bg-slate-950 text-white">
              <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
              <div className="relative h-36 w-36 rounded-lg border-2 border-primary/80 flex items-center justify-center text-xs text-white/85 text-center px-4">
                {cameraActive ? t("dashboard.cameraReady") : "Camera scanner"}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={startScanner} disabled={cameraActive}>Start scanner</Button>
              <Button type="button" variant="outline" onClick={stopScanner} disabled={!cameraActive}>Stop</Button>
            </div>
            {scannerMessage ? <p className="mt-2 text-xs text-muted-foreground">{scannerMessage}</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("dashboard.confirmRedemptionTitle")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {bizLat == null && (
              <p className="text-xs text-amber-600 font-medium">
                {t("dashboard.geofenceRequired")}
              </p>
            )}
            <Input placeholder={t("dashboard.redemptionCode")} value={redemptionCode} onChange={(e) => setRedemptionCode(e.target.value)} />
            <Input placeholder={t("dashboard.billAmount")} type="number" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
            <Button
              onClick={() => submitManual()}
            >
              {t("action.confirmRedemption")}
            </Button>
            {(redeem.error || redeemById.error) ? <p className="text-sm text-red-600">{apiError(redeem.error || redeemById.error)}</p> : null}
            {(redeem.data || redeemById.data) ? (
              <div className="rounded bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 space-y-1">
                <p className="font-semibold text-sm">{t("dashboard.redemptionVerified")}</p>
                <p className="text-xs">{t("dashboard.commissionLabel", { amount: currency((redeem.data || redeemById.data)?.commission_amount as string | number) })}</p>
                {(redeem.data || redeemById.data)?.held_for_review ? (
                  <p className="text-xs text-amber-700 font-medium mt-1">
                    {t("dashboard.heldScan", { distance: String((redeem.data || redeemById.data)?.distance_meters) })}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700">{t("dashboard.distanceInside", { distance: String((redeem.data || redeemById.data)?.distance_meters) })}</p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
