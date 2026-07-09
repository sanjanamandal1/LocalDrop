"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Camera, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Topbar } from "@/components/dashboard/sidebar";
import { useCreateCampaign, useProfile } from "@/hooks/use-api";
import { apiError } from "@/lib/api";
import { assetUrl } from "@/lib/assetUrl";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n/provider";
import type { ApiResponse, BusinessProfile } from "@/types/api";

const schema = z.object({
  name: z.string().min(2),
  offer_details: z.string().min(2),
  description: z.string().optional(),
  campaign_type: z.enum(["discount", "bogo", "freebie", "cashback", "other"]),
  commission_type: z.enum(["fixed", "percentage"]),
  commission_value: z.coerce.number().min(0),
  total_budget: z.coerce.number().min(100),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius_km: z.coerce.number().min(1),
  valid_from: z.string(),
  valid_till: z.string(),
  image_url: z.string().optional(),
  status: z.enum(["draft", "active"])
});

export default function CreateCampaignPage() {
  const { t } = useI18n();
  const router = useRouter();
  const create = useCreateCampaign();
  const profile = useProfile("business");
  const businessData = profile.data as BusinessProfile | undefined;
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError, setValue } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { campaign_type: "discount", commission_type: "fixed", radius_km: 5, status: "active" }
  });
  const preview = watch();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (businessData?.lat) setValue("lat", parseFloat(businessData.lat as string));
    if (businessData?.lng) setValue("lng", parseFloat(businessData.lng as string));
  }, [businessData, setValue]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(t("validation.imageType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("validation.imageSize"));
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("photo", file);
      
      const { data } = await api.post<ApiResponse<{ image_url: string }>>("/campaigns/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setValue("image_url", data.data.image_url);
      toast.success(t("toast.imageUploaded"));
    } catch (err) {
      toast.error(t("toast.imageUploadFailed"));
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await create.mutateAsync(values);
      router.push("/business/campaigns");
    } catch (error) {
      setError("root", { message: apiError(error) });
    }
  }

  return (
    <>
      <Topbar title={t("action.createCampaign")} />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader><CardTitle>{t("dashboard.campaignDetails")}</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <Input className="md:col-span-2" placeholder={t("dashboard.campaignName")} {...register("name")} />
              <Select {...register("campaign_type")}><option value="discount">{t("common.discount")}</option><option value="bogo">BOGO</option><option value="freebie">{t("common.freebie")}</option><option value="cashback">{t("common.cashback")}</option><option value="other">{t("common.other")}</option></Select>
              <Input placeholder={t("dashboard.imageUrl")} {...register("image_url")} />
              <Textarea className="md:col-span-2" placeholder={t("dashboard.offerDetails")} {...register("offer_details")} />
              <Textarea className="md:col-span-2" placeholder={t("common.description")} {...register("description")} />
              <Select {...register("commission_type")}><option value="fixed">{t("common.fixed")}</option><option value="percentage">{t("common.percentage")}</option></Select>
              <Input type="number" placeholder={t("dashboard.commissionValue")} {...register("commission_value")} />
              <Input type="number" placeholder={t("dashboard.totalBudget")} {...register("total_budget")} />
              <Input type="number" placeholder={t("dashboard.radiusKm")} {...register("radius_km")} />
              <Input type="number" step="any" placeholder={t("common.latitude")} {...register("lat")} />
              <Input type="number" step="any" placeholder={t("common.longitude")} {...register("lng")} />
              <Input type="date" {...register("valid_from")} />
              <Input type="date" {...register("valid_till")} />
              <Select className="md:col-span-2" {...register("status")}>
                <option value="active">Publish immediately</option>
                <option value="draft">Save as draft</option>
              </Select>
              {(errors.root || Object.keys(errors).length > 0) ? <p className="md:col-span-2 text-sm text-red-600">{errors.root?.message || t("validation.completeRequired")}</p> : null}
              <Button className="md:col-span-2" disabled={isSubmitting}>{isSubmitting ? t("common.saving") : t("action.createCampaign")}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("dashboard.campaignPreview")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-36 w-full overflow-hidden rounded-lg border-2 border-dashed border-[#E5E7EB] bg-[#F8FAFC] flex flex-col items-center justify-center text-[#6B7280] transition hover:border-[#6D28D9]/40 hover:bg-[#6D28D9]/5"
              disabled={uploadingImage}
            >
              {preview.image_url ? (
                <>
                  <img className="h-full w-full object-cover transition group-hover:opacity-40" src={assetUrl(preview.image_url)} alt="" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-semibold text-white bg-black/50">
                    <Upload className="h-5 w-5 mb-1" />
                    <span>{t("dashboard.changeImage")}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-xs">
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
                  ) : (
                    <>
                      <Camera className="h-8 w-8 mb-1 text-[#6B7280]" />
                      <span className="font-medium">{t("dashboard.addCampaignImage")}</span>
                    </>
                  )}
                </div>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
            <div><p className="font-semibold">{preview.name || t("dashboard.yourCampaign")}</p><p className="text-sm text-muted-foreground">{preview.offer_details || t("dashboard.campaignPreviewPlaceholder")}</p></div>
            <div className="rounded-lg border p-3 text-sm text-muted-foreground">{t("dashboard.visibleWithinKm", { km: preview.radius_km || 5 })}</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
