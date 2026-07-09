// TODO: replace with real API

export type NotificationSettings = {
  email_campaigns: boolean;
  email_earnings: boolean;
  push_redemptions: boolean;
  sms_payouts: boolean;
};

export type CreatorPreferences = {
  auto_join_nearby: boolean;
  show_earnings_publicly: boolean;
  preferred_niche: string;
};

export type ConnectedApp = {
  id: string;
  name: string;
  connected: boolean;
  icon: string;
};

const defaultNotifications: NotificationSettings = {
  email_campaigns: true,
  email_earnings: true,
  push_redemptions: true,
  sms_payouts: false,
};

export const settingsMockService = {
  async getNotifications(): Promise<NotificationSettings> {
    await delay(300);
    return { ...defaultNotifications };
  },

  async saveNotifications(data: NotificationSettings): Promise<NotificationSettings> {
    await delay(400);
    return data;
  },

  async getCreatorPreferences(): Promise<CreatorPreferences> {
    await delay(300);
    return { auto_join_nearby: false, show_earnings_publicly: false, preferred_niche: "" };
  },

  async saveCreatorPreferences(data: CreatorPreferences): Promise<CreatorPreferences> {
    await delay(400);
    return data;
  },

  async getConnectedApps(): Promise<ConnectedApp[]> {
    await delay(300);
    return [
      { id: "instagram", name: "Instagram", connected: false, icon: "📸" },
      { id: "youtube", name: "YouTube", connected: false, icon: "▶️" },
      { id: "google", name: "Google Analytics", connected: false, icon: "📊" },
    ];
  },

  async getTeamMembers() {
    await delay(300);
    return [
      { id: "1", name: "You (Owner)", email: "owner@business.com", role: "admin" },
    ];
  },

  async getApiKeys() {
    await delay(300);
    return { key: "ld_test_xxxxxxxx", webhook_url: "" };
  },
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
