"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { UseCurrentLocationButton } from "@/components/settings/UseCurrentLocationButton";
import { profileService } from "@/lib/services";
import { apiError } from "@/lib/api";
import { geocodeCityState } from "@/services/geocode";
import { useI18n } from "@/i18n/provider";
import type { BusinessProfile, CreatorProfile } from "@/types/api";

export function ProfileForm({ role, profile }: { role: "creator" | "business"; profile?: CreatorProfile | BusinessProfile }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { register, handleSubmit, setValue } = useForm<Record<string, unknown>>({ values: profile as unknown as Record<string, unknown> });
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => profileService.update(role, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", role] })
  });

  const handleProfileSubmit = async (values: Record<string, unknown>) => {
    let lat = values.lat;
    let lng = values.lng;

    if ((!lat || !lng) && values.city) {
      const coords = await geocodeCityState(values.city as string, values.state as string);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        setValue("lat", coords.lat);
        setValue("lng", coords.lng);
      }
    }

    mutation.mutate({
      ...values,
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>{role === "business" ? t("form.businessInformation") : t("form.creatorInformation")}</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(handleProfileSubmit)}>
          {role === "business" ? (
            <>
              <Input placeholder={t("common.businessName")} {...register("business_name")} />
              <Input placeholder={t("common.businessType")} {...register("business_type")} />
              <Input placeholder={t("common.phone")} {...register("phone")} />
              <Input placeholder={t("common.email")} {...register("email")} />
              <Input className="md:col-span-2" placeholder={t("common.address")} {...register("address")} />
              <Textarea className="md:col-span-2" placeholder={t("common.description")} {...register("description")} />
              <Input placeholder={t("form.logoUrl")} {...register("logo_url")} />
              <Input placeholder={t("form.coverUrl")} {...register("cover_url")} />
              <Input placeholder={t("common.instagram")} {...register("social_instagram")} />
              <Input placeholder={t("common.facebook")} {...register("social_facebook")} />
            </>
          ) : (
            <>
              <Input placeholder={t("common.name")} {...register("name")} />
              <Input placeholder={t("form.avatarUrl")} {...register("avatar_url")} />
              <Textarea className="md:col-span-2" placeholder={t("common.bio")} {...register("bio")} />
            </>
          )}
          <Input placeholder={t("common.city")} {...register("city")} />
          <Input placeholder={t("common.state")} {...register("state")} />
          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <UseCurrentLocationButton
              onLocation={(vals) => {
                if (vals.address && role === "business") setValue("address", vals.address);
                if (vals.city) setValue("city", vals.city);
                if (vals.state) setValue("state", vals.state);
                if (vals.lat) setValue("lat", vals.lat);
                if (vals.lng) setValue("lng", vals.lng);
              }}
            />
          </div>
          <Input type="number" step="any" placeholder={t("common.latitude")} {...register("lat")} />
          <Input type="number" step="any" placeholder={t("common.longitude")} {...register("lng")} />
          {mutation.error ? <p className="md:col-span-2 text-sm text-red-600">{apiError(mutation.error)}</p> : null}
          {mutation.isSuccess ? <p className="md:col-span-2 text-sm text-emerald-700">{t("form.profileSaved")}</p> : null}
          <Button className="md:col-span-2" disabled={mutation.isPending}>{t("action.saveChanges")}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function PayoutForm({ profile }: { profile?: CreatorProfile | BusinessProfile }) {
  const { t } = useI18n();
  const { register, handleSubmit, watch } = useForm<Record<string, unknown>>({ values: profile as unknown as Record<string, unknown> });
  const method = watch("payout_method");
  const mutation = useMutation({ mutationFn: profileService.updatePayout });
  return (
    <Card>
      <CardHeader><CardTitle>{t("common.payoutMethod")}</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <Select {...register("payout_method")}><option value="upi">{t("common.upi")}</option><option value="bank">{t("common.bankTransfer")}</option></Select>
          {method === "bank" ? (
            <>
              <Input placeholder={t("common.bankAccount")} {...register("bank_account")} />
              <Input placeholder={t("common.ifsc")} {...register("bank_ifsc")} />
            </>
          ) : (
            <Input placeholder={t("common.upiId")} {...register("upi_id")} />
          )}
          {mutation.error ? <p className="md:col-span-2 text-sm text-red-600">{apiError(mutation.error)}</p> : null}
          {mutation.isSuccess ? <p className="md:col-span-2 text-sm text-emerald-700">{t("form.payoutMethodSaved")}</p> : null}
          <Button className="md:col-span-2" disabled={mutation.isPending}>{t("action.saveChanges")}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
