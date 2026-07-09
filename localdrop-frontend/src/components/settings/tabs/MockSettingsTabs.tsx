"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService, settingsService } from "@/lib/services";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  InputField,
  PasswordInput,
  SaveButton,
  SectionHeader,
  SettingsCard,
  ToggleSwitch,
  VerificationCard,
} from "@/components/settings/SettingsPrimitives";
import { useI18n } from "@/i18n/provider";

export function NotificationsTab() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: settingsService.get });
  const [settings, setSettings] = useState(data?.notification_settings);

  useEffect(() => { if (data?.notification_settings) setSettings(data.notification_settings); }, [data]);

  const mutation = useMutation({
    mutationFn: settingsService.updateNotifications,
    onSuccess: () => toast.success(t("toast.notificationPreferencesSaved")),
  });

  if (isLoading || !settings) {
    return <div className="h-40 animate-pulse rounded-xl bg-[#E5E7EB]/40" />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SettingsCard title={t("settings.notifications")}>
        <ToggleSwitch label={t("settings.emailCampaignUpdates")} checked={settings.email_campaigns} onChange={(v) => setSettings({ ...settings, email_campaigns: v })} />
        <ToggleSwitch label={t("settings.emailEarnings")} checked={settings.email_earnings} onChange={(v) => setSettings({ ...settings, email_earnings: v })} />
        <ToggleSwitch label={t("settings.pushRedemptions")} checked={settings.push_redemptions} onChange={(v) => setSettings({ ...settings, push_redemptions: v })} />
        <ToggleSwitch label={t("settings.smsPayoutAlerts")} checked={settings.sms_payouts} onChange={(v) => setSettings({ ...settings, sms_payouts: v })} />
        <div className="mt-4">
          <button
            type="button"
            className="rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(settings)}
          >
            {mutation.isPending ? t("common.saving") : t("action.saveChanges")}
          </button>
        </div>
      </SettingsCard>
    </motion.div>
  );
}

export function PasswordTab() {
  const { t } = useI18n();
  const { register, handleSubmit } = useForm();
  const mutation = useMutation({
    mutationFn: settingsService.changePassword,
    onSuccess: () => toast.success(t("auth.passwordUpdated")),
    onError: () => toast.error(t("error.generic")),
  });
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SettingsCard title={t("settings.changePassword")}>
        <form className="grid max-w-md gap-4" onSubmit={handleSubmit((values) => mutation.mutate({ current_password: String(values.current || ""), new_password: String(values.new || "") }))}>
          <PasswordInput label={t("settings.currentPassword")} {...register("current", { required: true })} />
          <PasswordInput label={t("settings.newPassword")} {...register("new", { required: true, minLength: 8 })} />
          <PasswordInput label={t("auth.confirmNewPassword")} {...register("confirm")} />
          <SaveButton loading={mutation.isPending} />
        </form>
      </SettingsCard>
    </motion.div>
  );
}

export function PrivacyTab() {
  const { t } = useI18n();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: settingsService.get });
  const mutation = useMutation({ mutationFn: settingsService.updatePrivacy, onSuccess: () => toast.success(t("toast.preferencesSaved")) });
  const settings = data?.privacy_settings || { two_factor: false, show_profile_publicly: true, allow_data_analytics: true };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SettingsCard title={t("settings.privacySecurity")}>
        <ToggleSwitch label={t("settings.twoFactor")} description={t("settings.twoFactorDesc")} checked={settings.two_factor} onChange={(v) => mutation.mutate({ two_factor: v })} />
        <ToggleSwitch label={t("settings.showProfilePublicly")} checked={settings.show_profile_publicly} onChange={(v) => mutation.mutate({ show_profile_publicly: v })} />
        <ToggleSwitch label={t("settings.allowDataAnalytics")} checked={settings.allow_data_analytics} onChange={(v) => mutation.mutate({ allow_data_analytics: v })} />
      </SettingsCard>
    </motion.div>
  );
}

export function SocialAccountsTab() {
  const { t } = useI18n();
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SettingsCard title={t("settings.socialAccounts")} description={t("settings.socialAccountsDesc")}>
        {["Instagram", "YouTube", "Twitter/X"].map((platform) => (
          <div key={platform} className="flex items-center justify-between border-b border-[#E5E7EB] py-3 last:border-0">
            <span className="text-sm font-medium">{platform}</span>
            <button type="button" className="text-sm font-semibold text-[#6D28D9]" onClick={() => toast.message("OAuth connection is ready for provider credentials.")}>
              {t("action.connect")}
            </button>
          </div>
        ))}
      </SettingsCard>
    </motion.div>
  );
}

export function CreatorPreferencesTab() {
  const { t } = useI18n();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: settingsService.get });
  const [prefs, setPrefs] = useState(data?.creator_preferences);
  useEffect(() => { if (data?.creator_preferences) setPrefs(data.creator_preferences); }, [data]);
  const mutation = useMutation({ mutationFn: settingsService.updateCreatorPreferences, onSuccess: () => toast.success(t("toast.preferencesSaved")) });

  if (!prefs) return <div className="h-40 animate-pulse rounded-xl bg-[#E5E7EB]/40" />;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SettingsCard title={t("settings.creatorPreferences")}>
        <ToggleSwitch label={t("settings.autoJoinNearby")} checked={prefs.auto_join_nearby} onChange={(v) => setPrefs({ ...prefs, auto_join_nearby: v })} />
        <ToggleSwitch label={t("settings.showEarningsPublicly")} checked={prefs.show_earnings_publicly} onChange={(v) => setPrefs({ ...prefs, show_earnings_publicly: v })} />
        <InputField label={t("settings.preferredNiche")} value={prefs.preferred_niche} onChange={(e) => setPrefs({ ...prefs, preferred_niche: e.target.value })} />
        <div className="mt-4">
          <button type="button" className="rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-semibold text-white" onClick={() => mutation.mutate(prefs)}>
            {t("action.savePreferences")}
          </button>
        </div>
      </SettingsCard>
    </motion.div>
  );
}

export function ConnectedAppsTab() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: settingsService.get });
  const apps = data?.connected_apps || [];
  const mutation = useMutation({
    mutationFn: settingsService.updateConnectedApps,
    onSuccess: () => {
      toast.success(t("toast.preferencesSaved"));
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
  const toggleApp = (id: string) => mutation.mutate(apps.map((app: any) => app.id === id ? { ...app, connected: !app.connected } : app));
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SettingsCard title={t("settings.connectedApps")}>
        {apps.map((app: any) => (
          <div key={app.id} className="flex items-center justify-between py-3">
            <span className="text-sm font-medium">{app.icon} {app.name}</span>
            <button type="button" className="text-xs font-semibold text-[#6D28D9]" onClick={() => toggleApp(app.id)}>{app.connected ? t("common.connected") : t("common.notConnected")}</button>
          </div>
        ))}
      </SettingsCard>
    </motion.div>
  );
}

export function VerificationTab({ isVerified }: { isVerified?: boolean }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [idNum, setIdNum] = useState("");
  const [addressDoc, setAddressDoc] = useState("");
  const [bizDoc, setBizDoc] = useState("");

  const submitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNum) {
      toast.error(t("validation.govIdRequired"));
      return;
    }
    setLoading(true);
    try {
      await profileService.verify();
      toast.success(t("toast.verificationSubmitted"));
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      toast.error(t("toast.verificationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <SettingsCard title={t("settings.verificationKyc")} description={t("settings.verificationDesc")}>
        {isVerified ? (
          <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-start gap-3 mb-6">
            <span className="text-xl">OK</span>
            <div>
              <p className="font-bold">{t("settings.accountVerified")}</p>
              <p className="text-emerald-700 font-normal mt-0.5">{t("settings.kycThanks")}</p>
            </div>
          </div>
        ) : (
          <form className="space-y-4 mb-6 border-b pb-6" onSubmit={submitKYC}>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label={t("form.govId")}
                placeholder={t("form.enterIdNumber")}
                required
                value={idNum}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdNum(e.target.value)}
              />
              <InputField
                label={t("form.addressProofDoc")}
                placeholder={t("form.addressProofPlaceholder")}
                required
                value={addressDoc}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddressDoc(e.target.value)}
              />
              <div className="md:col-span-2">
                <InputField
                  label={t("form.businessGstin")}
                  placeholder={t("form.businessGstinPlaceholder")}
                  value={bizDoc}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBizDoc(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5B21B6] disabled:opacity-60"
              >
                {loading ? t("settings.verifying") : t("action.submitVerification")}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          <SectionHeader title={t("settings.verificationChecklist")} />
          <VerificationCard title={t("settings.identityVerification")} status={isVerified ? "verified" : "pending"} description={t("settings.identityVerificationDesc")} />
          <VerificationCard title={t("settings.addressProof")} status={isVerified ? "verified" : "pending"} description={t("settings.addressProofDesc")} />
          <VerificationCard title={t("settings.businessRegistration")} status={isVerified ? "verified" : "warning"} description={t("settings.businessRegistrationDesc")} />
        </div>
      </SettingsCard>
    </motion.div>
  );
}

export function TeamManagementTab() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: settingsService.get });
  const members = data?.team_members || [];
  const mutation = useMutation({
    mutationFn: settingsService.updateTeamMembers,
    onSuccess: () => {
      toast.success(t("toast.preferencesSaved"));
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
  const inviteMember = () => {
    const email = window.prompt("Member email");
    if (!email) return;
    mutation.mutate([...members, { id: crypto.randomUUID(), name: email.split("@")[0], email, role: "member" }]);
  };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SettingsCard title={t("settings.teamManagement")}>
        <SectionHeader title={t("settings.members")} subtitle={t("settings.membersSubtitle")} />
        {members.map((m: { id: string; name: string; email: string; role: string }) => (
          <div key={m.id} className="flex justify-between border-b border-[#E5E7EB] py-3">
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-xs text-[#6B7280]">{m.email}</p>
            </div>
            <span className="text-xs capitalize text-[#6B7280]">{m.role}</span>
          </div>
        ))}
        <button type="button" className="mt-4 text-sm font-semibold text-[#6D28D9]" onClick={inviteMember}>
          {t("settings.inviteMember")}
        </button>
      </SettingsCard>
    </motion.div>
  );
}

export function CampaignPreferencesTab() {
  const { t } = useI18n();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: settingsService.get });
  const mutation = useMutation({ mutationFn: settingsService.updateCampaignPreferences, onSuccess: () => toast.success(t("toast.preferencesSaved")) });
  const settings = data?.campaign_preferences || { auto_approve_creator_joins: false, require_geo_verified_redemptions: true, email_new_redemptions: true };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SettingsCard title={t("settings.campaignPreferences")}>
        <ToggleSwitch label={t("settings.autoApproveCreatorJoins")} checked={settings.auto_approve_creator_joins} onChange={(v) => mutation.mutate({ auto_approve_creator_joins: v })} />
        <ToggleSwitch label={t("settings.requireGeoVerifiedRedemptions")} checked={settings.require_geo_verified_redemptions} onChange={(v) => mutation.mutate({ require_geo_verified_redemptions: v })} />
        <ToggleSwitch label={t("settings.emailNewRedemptions")} checked={settings.email_new_redemptions} onChange={(v) => mutation.mutate({ email_new_redemptions: v })} />
      </SettingsCard>
    </motion.div>
  );
}

export function ApiIntegrationsTab() {
  const { t } = useI18n();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: settingsService.get });
  const mutation = useMutation({ mutationFn: settingsService.updateApiSettings, onSuccess: () => toast.success(t("toast.preferencesSaved")) });
  const [webhook, setWebhook] = useState("");
  useEffect(() => { setWebhook(data?.api_settings?.webhook_url || ""); }, [data]);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <SettingsCard title={t("settings.apiIntegrations")}>
        <InputField label={t("settings.apiKey")} value="Managed server-side" readOnly />
        <InputField label={t("settings.webhookUrl")} placeholder="https://your-app.com/webhook" value={webhook} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhook(e.target.value)} />
        <button type="button" className="mt-3 rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-semibold text-white" onClick={() => mutation.mutate({ webhook_url: webhook })}>{t("action.saveChanges")}</button>
      </SettingsCard>
    </motion.div>
  );
}

export function SecurityTab() {
  return <PasswordTab />;
}
