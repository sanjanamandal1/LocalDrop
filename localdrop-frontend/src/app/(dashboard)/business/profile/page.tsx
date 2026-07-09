"use client";

import { Topbar } from "@/components/dashboard/sidebar";
import { ProfileForm } from "@/components/forms/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileUploader } from "@/components/settings/ProfileUploader";
import { CoverUploader } from "@/components/settings/CoverUploader";
import { useProfile } from "@/hooks/use-api";
import { useI18n } from "@/i18n/provider";
import type { BusinessProfile } from "@/types/api";

export default function BusinessProfilePage() {
  const { t } = useI18n();
  const profile = useProfile("business");
  const data = profile.data as BusinessProfile | undefined;
  return (
    <>
      <Topbar title={t("common.profile")} />
      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="p-5 flex flex-col items-center text-center">
            <div className="w-full relative mb-4">
              <CoverUploader userId={data?.user_id || ""} coverUrl={data?.cover_url} />
            </div>
            <ProfileUploader
              userId={data?.user_id || ""}
              role="business"
              photoUrl={data?.profile_photo_url || data?.logo_url}
              size="lg"
            />
            <h2 className="mt-4 text-lg font-bold">{data?.business_name}</h2>
            <p className="text-sm text-muted-foreground">{data?.city}</p>
            {data?.is_verified ? <div className="mt-3"><Badge>{t("common.verified")}</Badge></div> : null}
          </CardContent>
        </Card>
        <ProfileForm role="business" profile={data} />
      </div>
    </>
  );
}
