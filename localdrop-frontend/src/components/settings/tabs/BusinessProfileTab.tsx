"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ProfileUploader } from "@/components/settings/ProfileUploader";
import { UseCurrentLocationButton } from "@/components/settings/UseCurrentLocationButton";
import { InputField, SaveButton, SettingsCard, TextAreaField } from "@/components/settings/SettingsPrimitives";
import { profileService } from "@/lib/services";
import { apiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useI18n } from "@/i18n/provider";
import type { BusinessProfile } from "@/types/api";

export function BusinessProfileTab({ profile }: { profile?: BusinessProfile }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { register, handleSubmit, setValue, formState: { isDirty } } = useForm({
    defaultValues: profile as Record<string, unknown>,
  });

  useEffect(() => {
    if (profile) Object.entries(profile).forEach(([k, v]) => setValue(k, v));
  }, [profile, setValue]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (isDirty) e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => profileService.update("business", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", "business"] });
      toast.success(t("toast.businessProfileSaved"));
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <SettingsCard title={t("settings.logoBranding")} description={t("settings.logoBrandingDesc")}>
        {user ? (
          <ProfileUploader
            userId={user.id}
            role="business"
            photoUrl={profile?.profile_photo_url || profile?.logo_url}
          />
        ) : null}
      </SettingsCard>
      <SettingsCard title={t("form.businessInformation")}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <InputField label={t("common.businessName")} {...register("business_name")} />
          <InputField label={t("common.businessType")} {...register("business_type")} />
          <InputField label={t("common.phone")} {...register("phone")} />
          <InputField label={t("common.email")} {...register("email")} />
          <div className="md:col-span-2">
            <InputField label={t("common.address")} {...register("address")} />
          </div>
          <div className="md:col-span-2">
            <TextAreaField label={t("common.description")} rows={3} {...register("description")} />
          </div>
          <InputField label={t("form.coverImageUrl")} {...register("cover_url")} />
          <InputField label={t("common.instagram")} {...register("social_instagram")} />
          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <UseCurrentLocationButton
              onLocation={(vals) => {
                if (vals.address) setValue("address", vals.address, { shouldDirty: true });
                if (vals.city) setValue("city", vals.city, { shouldDirty: true });
                if (vals.state) setValue("state", vals.state, { shouldDirty: true });
                if (vals.lat) setValue("lat", vals.lat, { shouldDirty: true });
                if (vals.lng) setValue("lng", vals.lng, { shouldDirty: true });
              }}
            />
          </div>
          <InputField label={t("common.city")} {...register("city")} />
          <InputField label={t("common.state")} {...register("state")} />
          <InputField label={t("common.latitude")} type="number" step="any" {...register("lat")} />
          <InputField label={t("common.longitude")} type="number" step="any" {...register("lng")} />
          <div className="md:col-span-2">
            <SaveButton loading={mutation.isPending} />
          </div>
        </form>
      </SettingsCard>
    </motion.div>
  );
}
