"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UseCurrentLocationButton } from "@/components/settings/UseCurrentLocationButton";
import { InputField, SaveButton, SelectField, SettingsCard } from "@/components/settings/SettingsPrimitives";
import { profileService, storeLocationService } from "@/lib/services";
import { apiError } from "@/lib/api";
import { useI18n } from "@/i18n/provider";
import type { BusinessProfile, CreatorProfile } from "@/types/api";

export function PaymentTab({ profile }: { profile?: CreatorProfile | BusinessProfile }) {
  const { t } = useI18n();
  const { register, handleSubmit, watch } = useForm({ defaultValues: profile as Record<string, unknown> });
  const method = watch("payout_method");
  const mutation = useMutation({
    mutationFn: profileService.updatePayout,
    onSuccess: () => toast.success(t("toast.paymentDetailsSaved")),
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SettingsCard title={t("settings.paymentDetails")} description={t("settings.paymentDetailsDesc")}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <SelectField label={t("common.payoutMethod")} {...register("payout_method")}>
            <option value="upi">{t("common.upi")}</option>
            <option value="bank">{t("common.bankTransfer")}</option>
          </SelectField>
          {method === "bank" ? (
            <>
              <InputField label={t("common.bankAccount")} {...register("bank_account")} />
              <InputField label={t("common.ifsc")} {...register("bank_ifsc")} />
            </>
          ) : (
            <InputField label={t("common.upiId")} {...register("upi_id")} />
          )}
          <div className="md:col-span-2">
            <SaveButton loading={mutation.isPending} />
          </div>
        </form>
      </SettingsCard>
    </motion.div>
  );
}

export function CreatorAudienceTab({ profile }: { profile?: CreatorProfile }) {
  const { t } = useI18n();
  const { register, handleSubmit, setValue } = useForm({ defaultValues: profile as Record<string, unknown> });
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => profileService.update("creator", payload),
    onSuccess: () => toast.success(t("toast.audienceLocationSaved")),
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SettingsCard title={t("nav.audienceLocation")} description={t("settings.audienceLocationDesc")}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <div className="md:col-span-2">
            <UseCurrentLocationButton
              onLocation={(vals) => {
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

type StoreRow = {
  id?: string;
  branch_name: string;
  address?: string;
  city?: string;
  state?: string;
  lat?: string;
  lng?: string;
};

export function StoreLocationsTab() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ["store-locations"],
    queryFn: storeLocationService.list,
  });
  const { register, handleSubmit, setValue, reset } = useForm<StoreRow>({
    defaultValues: { branch_name: "", address: "", city: "", state: "", lat: "", lng: "" },
  });

  const saveMutation = useMutation({
    mutationFn: storeLocationService.save,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store-locations"] });
      reset();
      toast.success(t("toast.storeLocationSaved"));
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: storeLocationService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store-locations"] });
      toast.success(t("toast.storeLocationRemoved"));
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <SettingsCard title={t("settings.addStoreBranch")}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((v) => saveMutation.mutate(v))}>
          <InputField label={t("settings.branchName")} {...register("branch_name", { required: true })} />
          <InputField label={t("common.address")} {...register("address")} />
          <div className="md:col-span-2">
            <UseCurrentLocationButton
              onLocation={(vals) => {
                if (vals.address) setValue("address", vals.address);
                if (vals.city) setValue("city", vals.city || "");
                if (vals.state) setValue("state", vals.state || "");
                if (vals.lat) setValue("lat", vals.lat);
                if (vals.lng) setValue("lng", vals.lng);
              }}
            />
          </div>
          <InputField label={t("common.city")} {...register("city")} />
          <InputField label={t("common.state")} {...register("state")} />
          <InputField label={t("common.latitude")} type="number" step="any" {...register("lat")} />
          <InputField label={t("common.longitude")} type="number" step="any" {...register("lng")} />
          <div className="md:col-span-2">
            <SaveButton loading={saveMutation.isPending} />
          </div>
        </form>
      </SettingsCard>
      <SettingsCard title={t("settings.yourBranches")}>
        {isLoading ? <p className="text-sm text-[#6B7280]">{t("common.loading")}</p> : null}
        <div className="space-y-3">
          {(stores as StoreRow[]).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3">
              <div>
                <p className="font-medium text-[#111827]">{s.branch_name}</p>
                <p className="text-sm text-[#6B7280]">{s.city}, {s.state} · {s.lat}, {s.lng}</p>
              </div>
              <button
                type="button"
                className="text-sm text-[#EF4444]"
                onClick={() => s.id && deleteMutation.mutate(s.id)}
              >
                {t("action.remove")}
              </button>
            </div>
          ))}
          {!isLoading && stores.length === 0 ? (
            <p className="text-sm text-[#6B7280]">{t("settings.noStoreLocations")}</p>
          ) : null}
        </div>
      </SettingsCard>
    </motion.div>
  );
}
