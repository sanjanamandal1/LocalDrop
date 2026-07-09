"use client";

import { Topbar } from "@/components/dashboard/sidebar";
import { ProfileForm } from "@/components/forms/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileUploader } from "@/components/settings/ProfileUploader";
import { useProfile } from "@/hooks/use-api";
import { currency } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import type { CreatorProfile } from "@/types/api";

export default function CreatorProfilePage() {
  const { t } = useI18n();
  const profile = useProfile("creator");
  const data = profile.data as CreatorProfile | undefined;
  return (
    <>
      <Topbar title={t("common.profile")} />
      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="p-5 flex flex-col items-center text-center">
            <ProfileUploader
              userId={data?.user_id || ""}
              role="creator"
              photoUrl={data?.profile_photo_url || data?.avatar_url}
              size="lg"
            />
            <h2 className="mt-4 text-lg font-bold">{data?.name}</h2>
            <p className="text-sm text-muted-foreground">{data?.city}</p>
            {data?.is_verified ? <div className="mt-3"><Badge>{t("common.verified")}</Badge></div> : null}
            <div className="mt-5 w-full rounded-lg border p-3 text-sm text-left"><p className="text-muted-foreground">{t("dashboard.totalEarnings")}</p><p className="text-xl font-bold">{currency(data?.total_earnings)}</p></div>
          </CardContent>
        </Card>
        <ProfileForm role="creator" profile={data} />
      </div>
    </>
  );
}
