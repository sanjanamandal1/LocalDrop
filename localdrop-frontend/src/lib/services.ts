import { api } from "@/lib/api";
import {
  demoBusinessCampaigns,
  demoBusinessCampaignStats,
  demoBusinessEarnings,
  demoBusinessOverview,
  demoBusinessProfile,
  demoBusinessTimeline,
  demoCities,
  demoCreatorCampaigns,
  demoCreatorCampaignStats,
  demoCreatorEarnings,
  demoCreatorOverview,
  demoCreatorPayoutEligibility,
  demoCreatorPayouts,
  demoCreatorProfile,
  demoCreatorTimeline,
  demoCreators,
  demoHeatmap,
  demoMatches,
  demoNearbyCampaigns,
  demoNotifications,
  demoQrData,
  demoRedemptions,
  demoStoreLocations
} from "@/lib/demoData";
import type {
  ApiResponse,
  BusinessOverview,
  Campaign,
  CampaignStat,
  CreatorOverview,
  EarningsResponse,
  PayoutEligibility,
  PayoutsResponse,
  Profile,
  QRCodeData,
  Redemption,
  StoreLocation,
  TimelinePoint,
  User
} from "@/types/api";

function hasUsefulData(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (!value || typeof value !== "object") return value != null;
  if ("earnings" in value && Array.isArray((value as EarningsResponse).earnings)) return (value as EarningsResponse).earnings.length > 0;
  if ("payouts" in value && Array.isArray((value as PayoutsResponse).payouts)) return (value as PayoutsResponse).payouts.length > 0;
  return true;
}

async function withDemo<T>(request: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const data = await request();
    return hasUsefulData(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

export const authService = {
  async login(payload: { email: string; password: string }) {
    const { data } = await api.post<ApiResponse<{ user: User; profile: Profile | null; accessToken: string; refreshToken: string }>>("/auth/login", payload);
    return data.data;
  },
  async register(payload: { email: string; password: string; role: "creator" | "business"; name: string; city?: string; state?: string; lat?: number; lng?: number }) {
    const { data } = await api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>("/auth/register", payload);
    return data.data;
  },
  logout: () => api.post("/auth/logout")
};

export const campaignService = {
  businessMine: async (status?: string) => withDemo(
    async () => (await api.get<ApiResponse<Campaign[]>>("/campaigns/business/mine", { params: { status } })).data.data,
    status ? demoBusinessCampaigns.filter((campaign) => campaign.status === status) : demoBusinessCampaigns
  ),
  creatorMine: async () => withDemo(async () => (await api.get<ApiResponse<Campaign[]>>("/campaigns/creator/mine")).data.data, demoCreatorCampaigns),
  nearby: async (params: { lat: number; lng: number; radius?: number }) => withDemo(async () => (await api.get<ApiResponse<Campaign[]>>("/campaigns/nearby", { params })).data.data, demoNearbyCampaigns),
  get: async (id: string) => (await api.get<ApiResponse<Campaign>>(`/campaigns/${id}`)).data.data,
  create: async (payload: Partial<Campaign>) => (await api.post<ApiResponse<Campaign>>("/campaigns", payload)).data.data,
  updateStatus: async (id: string, status: "active" | "paused" | "ended") => (await api.patch<ApiResponse<{ id: string; status: string }>>(`/campaigns/${id}/status`, { status })).data.data,
  join: async (id: string) => withDemo(async () => (await api.post<ApiResponse<QRCodeData>>(`/campaigns/${id}/join`)).data.data, { ...demoQrData, campaign_id: id }),
  matches: async (params: { creator_id?: string }) => withDemo(async () => (await api.get<ApiResponse<any[]>>("/campaigns/matches", { params })).data.data, demoMatches),
  creators: async () => withDemo(async () => (await api.get<ApiResponse<any[]>>("/campaigns/creators")).data.data, demoCreators),
  createMatchCampaign: async (businessId: string, creatorId?: string) => (await api.post<ApiResponse<{ campaignId: string; qrToken: string }>>("/campaigns/match-create", { business_id: businessId, creator_id: creatorId })).data.data,
};

export const qrService = {
  getCreatorQR: async (campaignId: string) => withDemo(async () => (await api.get<ApiResponse<QRCodeData>>(`/qr/campaign/${campaignId}`)).data.data, { ...demoQrData, campaign_id: campaignId }),
  scan: async (token: string) => (await api.get<ApiResponse<Record<string, string>>>(`/qr/scan/${token}`)).data.data,
  claim: async (payload: Record<string, string | number | undefined>) => (await api.post<ApiResponse<Record<string, string>>>("/qr/claim", payload)).data.data,
  redeem: async (payload: { redemption_id: string; business_lat?: number; business_lng?: number; bill_amount?: number; confirm_accuracy?: number }) => (await api.post<ApiResponse<Record<string, string | number | boolean | null>>>("/qr/redeem", payload)).data.data,
  redeemManual: async (payload: { redemption_code: string; business_lat?: number; business_lng?: number; bill_amount?: number; confirm_accuracy?: number }) => (await api.post<ApiResponse<Record<string, string | number | boolean | null>>>("/qr/redeem/manual", payload)).data.data
};

export const analyticsService = {
  creatorOverview: async () => withDemo(async () => (await api.get<ApiResponse<CreatorOverview>>("/analytics/creator/overview")).data.data, demoCreatorOverview),
  creatorCampaigns: async () => withDemo(async () => (await api.get<ApiResponse<CampaignStat[]>>("/analytics/creator/campaigns")).data.data, demoCreatorCampaignStats),
  creatorHeatmap: async () => withDemo(async () => (await api.get<ApiResponse<{ lat: string | number; lng: string | number; weight: string | number }[]>>("/analytics/creator/heatmap")).data.data, demoHeatmap),
  businessOverview: async () => withDemo(async () => (await api.get<ApiResponse<BusinessOverview>>("/analytics/business/overview")).data.data, demoBusinessOverview),
  businessCampaigns: async () => withDemo(async () => (await api.get<ApiResponse<CampaignStat[]>>("/analytics/business/campaigns")).data.data, demoBusinessCampaignStats),
  businessRedemptions: async () => withDemo(async () => (await api.get<ApiResponse<Redemption[]>>("/analytics/business/redemptions")).data.data, demoRedemptions),
  businessTimeline: async () => withDemo(async () => (await api.get<ApiResponse<TimelinePoint[]>>("/analytics/business/timeline")).data.data, demoBusinessTimeline),
  businessCities: async () => withDemo(async () => (await api.get<ApiResponse<{ city: string; redemptions: string | number; revenue: string | number }[]>>("/analytics/business/cities")).data.data, demoCities)
};

export const earningsService = {
  creator: async () => withDemo(async () => (await api.get<ApiResponse<EarningsResponse>>("/earnings/creator")).data.data, demoCreatorEarnings),
  creatorTimeline: async () => withDemo(async () => (await api.get<ApiResponse<TimelinePoint[]>>("/earnings/creator/timeline")).data.data, demoCreatorTimeline),
  creatorByCampaign: async () => withDemo(async () => (await api.get<ApiResponse<CampaignStat[]>>("/earnings/creator/by-campaign")).data.data, demoCreatorCampaignStats),
  business: async () => withDemo(async () => (await api.get<ApiResponse<Record<string, string | number | null>>>("/earnings/business")).data.data, demoBusinessEarnings)
};

export const payoutService = {
  eligibility: async () => withDemo(async () => (await api.get<ApiResponse<PayoutEligibility>>("/payouts/eligibility")).data.data, demoCreatorPayoutEligibility),
  request: async () => (await api.post<ApiResponse<Record<string, string | number>>>("/payouts/request")).data.data,
  creator: async () => withDemo(async () => (await api.get<ApiResponse<PayoutsResponse>>("/payouts/creator")).data.data, demoCreatorPayouts)
};

export const profileService = {
  get: async (role: "creator" | "business") => withDemo(async () => (await api.get<ApiResponse<Profile>>(`/profile/${role}`)).data.data, role === "business" ? demoBusinessProfile : demoCreatorProfile),
  update: async (role: "creator" | "business", payload: Record<string, unknown>) => (await api.put<ApiResponse<Profile>>(`/profile/${role}`, payload)).data.data,
  updatePayout: async (payload: Record<string, unknown>) => (await api.put<ApiResponse<{ message: string }>>("/settings/payout-method", payload)).data,
  verify: async () => (await api.post<ApiResponse<any>>("/profile/verify")).data.data,
  uploadPhoto: async (userId: string, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("photo", file);
    const { data } = await api.post<ApiResponse<Profile>>(`/users/${userId}/profile-photo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return data.data;
  },
  uploadCover: async (userId: string, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("photo", file);
    const { data } = await api.post<ApiResponse<Profile>>(`/users/${userId}/cover-photo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return data.data;
  },
};

export const storeLocationService = {
  list: async () => withDemo(async () => (await api.get<ApiResponse<StoreLocation[]>>("/store-locations")).data.data, demoStoreLocations),
  save: async (payload: Partial<StoreLocation>) => (await api.post<ApiResponse<StoreLocation>>("/store-locations", payload)).data.data,
  remove: async (id: string) => (await api.delete<ApiResponse<{ message: string }>>(`/store-locations/${id}`)).data,
};

export const earningsDetailService = {
  byRedemption: async (redemptionId: string) => (await api.get<ApiResponse<Record<string, unknown>>>(`/earnings/${redemptionId}`)).data.data,
};

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

export type PrivacySettings = {
  two_factor: boolean;
  show_profile_publicly: boolean;
  allow_data_analytics: boolean;
};

export type CampaignPreferences = {
  auto_approve_creator_joins: boolean;
  require_geo_verified_redemptions: boolean;
  email_new_redemptions: boolean;
};

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  type: "joined" | "earning" | "match" | "info";
  is_read: boolean;
  created_at: string;
};

export const settingsService = {
  get: async () => (await api.get<ApiResponse<any>>("/settings")).data.data,
  updateNotifications: async (payload: NotificationSettings) => (await api.put<ApiResponse<NotificationSettings>>("/settings/notifications", payload)).data.data,
  updatePrivacy: async (payload: Partial<PrivacySettings>) => (await api.put<ApiResponse<PrivacySettings>>("/settings/privacy", payload)).data.data,
  updateCreatorPreferences: async (payload: CreatorPreferences) => (await api.put<ApiResponse<CreatorPreferences>>("/settings/creator-preferences", payload)).data.data,
  updateCampaignPreferences: async (payload: Partial<CampaignPreferences>) => (await api.put<ApiResponse<CampaignPreferences>>("/settings/campaign-preferences", payload)).data.data,
  updateConnectedApps: async (payload: any[]) => (await api.put<ApiResponse<any[]>>("/settings/connected-apps", payload)).data.data,
  updateTeamMembers: async (payload: any[]) => (await api.put<ApiResponse<any[]>>("/settings/team-members", payload)).data.data,
  updateApiSettings: async (payload: { webhook_url?: string }) => (await api.put<ApiResponse<{ webhook_url: string }>>("/settings/api", payload)).data.data,
  changePassword: async (payload: { current_password: string; new_password: string }) => (await api.put<ApiResponse<{ message: string }>>("/settings/password", payload)).data,
};

export const notificationService = {
  list: async () => withDemo(async () => (await api.get<ApiResponse<AppNotification[]>>("/settings/notifications/feed")).data.data, demoNotifications),
  markRead: async (id: string) => (await api.patch<ApiResponse<{ id: string }>>(`/settings/notifications/feed/${id}/read`)).data.data,
  clear: async () => (await api.delete<ApiResponse<{ cleared: boolean }>>("/settings/notifications/feed")).data.data,
};

export const adminService = {
  stats: async () => (await api.get<ApiResponse<Record<string, string | number>>>("/admin/stats")).data.data,
  users: async () => (await api.get<ApiResponse<any[]>>("/admin/users")).data.data,
  disputes: async () => (await api.get<ApiResponse<any[]>>("/admin/disputes")).data.data,
  pendingPayouts: async () => (await api.get<ApiResponse<any[]>>("/admin/payouts/pending")).data.data,
  setUserStatus: async (id: string, is_active: boolean) => (await api.patch<ApiResponse<any>>(`/admin/users/${id}/status`, { is_active })).data.data,
};
