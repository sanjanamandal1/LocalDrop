export type Role = "creator" | "business" | "admin";
export type CampaignStatus = "draft" | "active" | "paused" | "ended" | "cancelled";
export type CampaignType = "discount" | "bogo" | "freebie" | "cashback" | "other";
export type CommissionType = "fixed" | "percentage";
export type EarningStatus = "pending" | "available" | "paid" | "disputed" | "reversed";
export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page?: number; limit?: number };
  errors?: { msg: string; path?: string }[];
};

export type User = {
  id: string;
  email: string;
  role: Role;
  created_at?: string;
};

export type CreatorProfile = {
  id: string;
  user_id: string;
  name: string;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  lat?: string | number | null;
  lng?: string | number | null;
  payout_method?: "bank" | "upi" | null;
  bank_account?: string | null;
  bank_ifsc?: string | null;
  upi_id?: string | null;
  total_earnings: string | number;
  total_paid: string | number;
  pending_payout: string | number;
  is_verified?: boolean;
};

export type BusinessProfile = {
  id: string;
  user_id: string;
  business_name: string;
  business_type?: string | null;
  description?: string | null;
  logo_url?: string | null;
  profile_photo_url?: string | null;
  cover_url?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  lat?: string | number | null;
  lng?: string | number | null;
  social_instagram?: string | null;
  social_facebook?: string | null;
  social_whatsapp?: string | null;
  payout_method?: "bank" | "upi" | null;
  bank_account?: string | null;
  bank_ifsc?: string | null;
  upi_id?: string | null;
  is_verified?: boolean;
};

export type Profile = CreatorProfile | BusinessProfile;

export type Campaign = {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  campaign_type: CampaignType;
  offer_details: string;
  image_url?: string | null;
  commission_type: CommissionType;
  commission_value: string | number;
  total_budget: string | number;
  spent_budget: string | number;
  lat: string | number;
  lng: string | number;
  radius_km: string | number;
  valid_from: string;
  valid_till: string;
  status: CampaignStatus;
  total_views: number;
  total_claims: number;
  total_redemptions: number;
  total_revenue: string | number;
  business_name?: string;
  logo_url?: string | null;
  city?: string | null;
  distance_km?: string | number;
  already_joined?: boolean;
  qr_token?: string;
  qr_link?: string;
  scan_count?: number;
  claim_count?: number;
  my_earnings?: string | number;
};

export type QRCodeData = {
  id: string;
  campaign_id: string;
  creator_id: string;
  qr_token: string;
  qr_data_url?: string | null;
  qr_link: string;
  scan_count: number;
  claim_count: number;
};

export type CreatorOverview = {
  total_campaigns_joined: string | number;
  total_qr_views: string | number;
  total_claims: string | number;
  total_redemptions: string | number;
  total_earnings: string | number;
  pending_earnings: string | number;
  available_earnings: string | number;
  paid_earnings: string | number;
  conversion_rate: string | number | null;
  avg_earning_per_redemption: string | number;
};

export type BusinessOverview = {
  active_campaigns: string | number;
  total_campaigns: string | number;
  total_views: string | number;
  total_claims: string | number;
  total_redemptions: string | number;
  total_revenue: string | number;
  conversion_rate: string | number | null;
  pending_payouts: string | number;
};

export type CampaignStat = {
  id?: string;
  campaign_id?: string;
  name?: string;
  campaign_name?: string;
  offer_details?: string;
  status?: CampaignStatus;
  business_name?: string;
  qr_views?: string | number;
  claims?: string | number;
  redemptions?: string | number;
  earnings?: string | number;
  total_earnings?: string | number;
  total_views?: string | number;
  total_claims?: string | number;
  total_redemptions?: string | number;
  total_revenue?: string | number;
  conversion_rate?: string | number | null;
  creator_count?: string | number;
};

export type TimelinePoint = {
  period: string;
  redemptions?: string | number;
  revenue?: string | number;
  commission?: string | number;
  amount?: string | number;
};

export type Redemption = {
  id: string;
  redemption_code: string;
  status: string;
  confirmed_at: string;
  bill_amount?: string | number | null;
  commission_amount?: string | number | null;
  geo_verified: boolean;
  campaign_name: string;
  creator_name: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  earning_status?: string;
};

export type EarningsResponse = {
  summary: Record<string, string | number>;
  earnings: Record<string, string | number | null>[];
  meta: { page: number; limit: number };
};

export type PayoutsResponse = {
  summary: Record<string, string | number>;
  payouts: Record<string, string | number | null>[];
  meta: { page: number; limit: number };
};

export type PayoutEligibility = {
  available_amount: number;
  minimum_payout: number;
  is_eligible: boolean;
  has_pending_payout: boolean;
  reason?: string | null;
};

export type StoreLocation = {
  id: string;
  business_id: string;
  branch_name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  lat?: string | number | null;
  lng?: string | number | null;
};
