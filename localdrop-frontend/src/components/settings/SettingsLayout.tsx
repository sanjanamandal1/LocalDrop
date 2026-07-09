"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/sidebar";
import { SettingsMenu, creatorTabs, businessTabs, type CreatorTabId, type BusinessTabId } from "@/components/settings/SettingsMenu";
import { CreatorAccountTab } from "@/components/settings/tabs/CreatorAccountTab";
import { BusinessProfileTab } from "@/components/settings/tabs/BusinessProfileTab";
import {
  PaymentTab,
  CreatorAudienceTab,
  StoreLocationsTab,
} from "@/components/settings/tabs/SharedSettingsTabs";
import {
  NotificationsTab,
  PasswordTab,
  PrivacyTab,
  SocialAccountsTab,
  CreatorPreferencesTab,
  ConnectedAppsTab,
  VerificationTab,
  TeamManagementTab,
  CampaignPreferencesTab,
  ApiIntegrationsTab,
  SecurityTab,
} from "@/components/settings/tabs/MockSettingsTabs";
import { useProfile } from "@/hooks/use-api";
import { useI18n } from "@/i18n/provider";
import type { BusinessProfile, CreatorProfile } from "@/types/api";

export function CreatorSettingsLayout() {
  const { t } = useI18n();
  const [tab, setTab] = useState<CreatorTabId>("account");
  const profile = useProfile("creator");
  const data = profile.data as CreatorProfile | undefined;

  return (
    <>
      <Topbar title={t("settings.title")} />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border bg-card p-3">
          <p className="mb-3 hidden px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:block">{t("settings.title")}</p>
          <SettingsMenu tabs={creatorTabs} active={tab} onChange={setTab} />
        </aside>
        <div className="min-w-0">
          {profile.isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
          ) : (
            <>
              {tab === "account" && <CreatorAccountTab profile={data} />}
              {tab === "notifications" && <NotificationsTab />}
              {tab === "payment" && <PaymentTab profile={data} />}
              {tab === "password" && <PasswordTab />}
              {tab === "privacy" && <PrivacyTab />}
              {tab === "social" && <SocialAccountsTab />}
              {tab === "preferences" && <CreatorPreferencesTab />}
              {tab === "audience" && <CreatorAudienceTab profile={data} />}
              {tab === "verification" && <VerificationTab isVerified={data?.is_verified} />}
              {tab === "connected" && <ConnectedAppsTab />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function BusinessSettingsLayout() {
  const { t } = useI18n();
  const [tab, setTab] = useState<BusinessTabId>("profile");
  const profile = useProfile("business");
  const data = profile.data as BusinessProfile | undefined;

  return (
    <>
      <Topbar title={t("settings.title")} />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border bg-card p-3">
          <p className="mb-3 hidden px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:block">{t("settings.title")}</p>
          <SettingsMenu tabs={businessTabs} active={tab} onChange={setTab} />
        </aside>
        <div className="min-w-0">
          {profile.isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
          ) : (
            <>
              {tab === "profile" && <BusinessProfileTab profile={data} />}
              {tab === "notifications" && <NotificationsTab />}
              {tab === "payment" && <PaymentTab profile={data} />}
              {tab === "security" && <SecurityTab />}
              {tab === "team" && <TeamManagementTab />}
              {tab === "stores" && <StoreLocationsTab />}
              {tab === "campaigns" && <CampaignPreferencesTab />}
              {tab === "api" && <ApiIntegrationsTab />}
              {tab === "verification" && <VerificationTab isVerified={data?.is_verified} />}
              {tab === "privacy" && <PrivacyTab />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
