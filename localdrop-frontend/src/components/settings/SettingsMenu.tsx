"use client";

import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";

const creatorTabs = [
  { id: "account", labelKey: "settings.account" },
  { id: "notifications", labelKey: "settings.notifications" },
  { id: "payment", labelKey: "settings.paymentDetails" },
  { id: "password", labelKey: "settings.changePassword" },
  { id: "privacy", labelKey: "settings.privacySecurity" },
  { id: "social", labelKey: "settings.socialAccounts" },
  { id: "preferences", labelKey: "settings.creatorPreferences" },
  { id: "audience", labelKey: "nav.audienceLocation" },
  { id: "verification", labelKey: "settings.verificationKyc" },
  { id: "connected", labelKey: "settings.connectedApps" },
] as const;

const businessTabs = [
  { id: "profile", labelKey: "settings.businessProfile" },
  { id: "notifications", labelKey: "settings.notifications" },
  { id: "payment", labelKey: "settings.paymentBilling" },
  { id: "security", labelKey: "settings.accountSecurity" },
  { id: "team", labelKey: "settings.teamManagement" },
  { id: "stores", labelKey: "settings.storeLocations" },
  { id: "campaigns", labelKey: "settings.campaignPreferences" },
  { id: "api", labelKey: "settings.apiIntegrations" },
  { id: "verification", labelKey: "settings.verification" },
  { id: "privacy", labelKey: "settings.privacy" },
] as const;

export type CreatorTabId = (typeof creatorTabs)[number]["id"];
export type BusinessTabId = (typeof businessTabs)[number]["id"];

export function SettingsMenu<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly { id: T; labelKey: TranslationKey }[];
  active: T;
  onChange: (id: T) => void;
}) {
  const { t } = useI18n();

  return (
    <>
      <nav className="hidden md:block space-y-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
              active === tab.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>
      <div className="flex gap-2 overflow-x-auto pb-2 md:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
              active === tab.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground"
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
    </>
  );
}

export { creatorTabs, businessTabs };
