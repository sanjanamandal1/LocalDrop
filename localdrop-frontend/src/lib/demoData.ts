import type {
  BusinessOverview,
  BusinessProfile,
  Campaign,
  CampaignStat,
  CreatorOverview,
  CreatorProfile,
  EarningsResponse,
  PayoutEligibility,
  PayoutsResponse,
  QRCodeData,
  Redemption,
  StoreLocation,
  TimelinePoint
} from "@/types/api";
import type { AppNotification } from "@/lib/services";

const now = "2026-06-20T10:30:00.000Z";

export const demoBusinessProfile: BusinessProfile = {
  id: "demo-business-profile",
  user_id: "demo-business-user",
  business_name: "Neon Brew Cafe",
  business_type: "Cafe & quick bites",
  description: "A high-energy coffee spot using creator-led QR offers to turn online attention into verified store visits.",
  phone: "+91 98765 43210",
  email: "hello@neonbrew.example",
  address: "56 Creator Street, Indore",
  city: "Indore",
  state: "Madhya Pradesh",
  lat: 22.7196,
  lng: 75.8577,
  social_instagram: "@neonbrew",
  social_whatsapp: "+919876543210",
  payout_method: "upi",
  upi_id: "neonbrew@upi",
  is_verified: true
};

export const demoCreatorProfile: CreatorProfile = {
  id: "demo-creator-profile",
  user_id: "demo-creator-user",
  name: "Aarav Socials",
  bio: "Food, student hangouts, and city discovery creator with a highly local audience.",
  city: "Indore",
  state: "Madhya Pradesh",
  lat: 22.7196,
  lng: 75.8577,
  payout_method: "upi",
  upi_id: "aaravsocials@upi",
  total_earnings: 42850,
  total_paid: 30000,
  pending_payout: 12850,
  is_verified: true
};

export const demoBusinessCampaigns: Campaign[] = [
  {
    id: "demo-campaign-1",
    business_id: "demo-business",
    name: "Campus Cold Brew Rush",
    description: "Creator QR offer for students visiting after class.",
    campaign_type: "discount" as const,
    offer_details: "Flat 25% off cold brew combos",
    commission_type: "fixed" as const,
    commission_value: 80,
    total_budget: 50000,
    spent_budget: 18400,
    lat: 22.7196,
    lng: 75.8577,
    radius_km: 5,
    valid_from: "2026-06-01",
    valid_till: "2026-07-15",
    status: "active" as const,
    total_views: 18420,
    total_claims: 2860,
    total_redemptions: 642,
    total_revenue: 321000,
    business_name: "Neon Brew Cafe",
    city: "Indore",
    scan_count: 18420,
    claim_count: 2860,
    my_earnings: 51360
  },
  {
    id: "demo-campaign-2",
    business_id: "demo-business",
    name: "Weekend Waffle Drop",
    description: "Weekend offer designed for reels and group visits.",
    campaign_type: "bogo",
    offer_details: "Buy 1 waffle, get 1 mini waffle free",
    commission_type: "fixed",
    commission_value: 65,
    total_budget: 35000,
    spent_budget: 12675,
    lat: 22.7233,
    lng: 75.8839,
    radius_km: 7,
    valid_from: "2026-06-05",
    valid_till: "2026-07-05",
    status: "active",
    total_views: 12180,
    total_claims: 1940,
    total_redemptions: 381,
    total_revenue: 209550,
    business_name: "Neon Brew Cafe",
    city: "Vijay Nagar",
    scan_count: 12180,
    claim_count: 1940,
    my_earnings: 24765
  },
  {
    id: "demo-campaign-3",
    business_id: "demo-business",
    name: "Creator Latte Launch",
    description: "New signature latte launch with creator-first rewards.",
    campaign_type: "cashback",
    offer_details: "Rs50 creator reward per verified latte walk-in",
    commission_type: "fixed",
    commission_value: 50,
    total_budget: 42000,
    spent_budget: 9800,
    lat: 22.7042,
    lng: 75.8498,
    radius_km: 8,
    valid_from: "2026-06-10",
    valid_till: "2026-08-01",
    status: "active",
    total_views: 8900,
    total_claims: 1012,
    total_redemptions: 196,
    total_revenue: 117600,
    business_name: "Neon Brew Cafe",
    city: "Palasia",
    scan_count: 8900,
    claim_count: 1012,
    my_earnings: 9800
  },
  {
    id: "demo-campaign-4",
    business_id: "demo-business",
    name: "Monsoon Mocha Preview",
    description: "Draft offer ready for launch.",
    campaign_type: "freebie",
    offer_details: "Free brownie bite with every mocha",
    commission_type: "percentage",
    commission_value: 8,
    total_budget: 25000,
    spent_budget: 0,
    lat: 22.7196,
    lng: 75.8577,
    radius_km: 4,
    valid_from: "2026-07-01",
    valid_till: "2026-08-15",
    status: "draft",
    total_views: 0,
    total_claims: 0,
    total_redemptions: 0,
    total_revenue: 0,
    business_name: "Neon Brew Cafe",
    city: "Indore"
  }
];

export const demoNearbyCampaigns: Campaign[] = [
  ...demoBusinessCampaigns.slice(0, 3),
  {
    id: "demo-campaign-5",
    business_id: "demo-business-2",
    name: "Street Bowl Lunch Blast",
    description: "Lunch-hour creator QR campaign for office crowds.",
    campaign_type: "discount" as const,
    offer_details: "Rs120 off rice bowls above Rs399",
    commission_type: "fixed" as const,
    commission_value: 90,
    total_budget: 60000,
    spent_budget: 22860,
    lat: 22.7533,
    lng: 75.8937,
    radius_km: 6,
    valid_from: "2026-06-08",
    valid_till: "2026-07-20",
    status: "active" as const,
    total_views: 15400,
    total_claims: 2110,
    total_redemptions: 254,
    total_revenue: 190500,
    business_name: "Street Bowl Co.",
    city: "Indore",
    distance_km: 2.8,
    already_joined: false
  }
].map((campaign, index) => ({ ...campaign, distance_km: campaign.distance_km ?? 1.4 + index, already_joined: index === 0 }));

export const demoCreatorCampaigns: Campaign[] = demoNearbyCampaigns.slice(0, 3).map((campaign, index) => ({
  ...campaign,
  already_joined: true,
  qr_token: `demo-token-${index + 1}`,
  qr_link: `http://localhost:3001/c/demo-token-${index + 1}`,
  scan_count: [3240, 2180, 1460][index],
  claim_count: [520, 335, 188][index],
  total_redemptions: [146, 84, 51][index],
  my_earnings: [11680, 5460, 2550][index]
}));

export const demoBusinessOverview: BusinessOverview = {
  active_campaigns: 3,
  total_campaigns: 4,
  total_views: 39480,
  total_claims: 5812,
  total_redemptions: 1219,
  total_revenue: 648150,
  conversion_rate: 3.09,
  pending_payouts: 40875
};

export const demoCreatorOverview: CreatorOverview = {
  total_campaigns_joined: 3,
  total_qr_views: 6880,
  total_claims: 1043,
  total_redemptions: 281,
  total_earnings: 19690,
  pending_earnings: 4850,
  available_earnings: 12840,
  paid_earnings: 7000,
  conversion_rate: 4.08,
  avg_earning_per_redemption: 70
};

export const demoBusinessCampaignStats: CampaignStat[] = demoBusinessCampaigns.map((campaign) => ({
  id: campaign.id,
  name: campaign.name,
  status: campaign.status,
  total_views: campaign.total_views,
  total_claims: campaign.total_claims,
  total_redemptions: campaign.total_redemptions,
  total_revenue: campaign.total_revenue,
  conversion_rate: campaign.total_views ? Number(((campaign.total_redemptions / campaign.total_views) * 100).toFixed(2)) : 0,
  creator_count: [18, 12, 9, 0][demoBusinessCampaigns.indexOf(campaign)]
}));

export const demoCreatorCampaignStats: CampaignStat[] = demoCreatorCampaigns.map((campaign) => ({
  campaign_id: campaign.id,
  name: campaign.name,
  campaign_name: campaign.name,
  business_name: campaign.business_name,
  status: campaign.status,
  qr_views: campaign.scan_count,
  claims: campaign.claim_count,
  redemptions: campaign.total_redemptions,
  earnings: campaign.my_earnings,
  total_earnings: campaign.my_earnings,
  conversion_rate: campaign.scan_count ? Number(((Number(campaign.total_redemptions) / Number(campaign.scan_count)) * 100).toFixed(2)) : 0
}));

export const demoBusinessTimeline: TimelinePoint[] = [
  { period: "Jun 14", redemptions: 84, revenue: 45200, commission: 6720 },
  { period: "Jun 15", redemptions: 112, revenue: 60450, commission: 8960 },
  { period: "Jun 16", redemptions: 96, revenue: 52180, commission: 7680 },
  { period: "Jun 17", redemptions: 141, revenue: 75900, commission: 11280 },
  { period: "Jun 18", redemptions: 166, revenue: 88400, commission: 13280 },
  { period: "Jun 19", redemptions: 154, revenue: 83250, commission: 12320 },
  { period: "Jun 20", redemptions: 188, revenue: 101750, commission: 15040 }
];

export const demoCreatorTimeline: TimelinePoint[] = [
  { period: "Jun 14", amount: 1120, redemptions: 14 },
  { period: "Jun 15", amount: 1680, redemptions: 21 },
  { period: "Jun 16", amount: 1280, redemptions: 16 },
  { period: "Jun 17", amount: 2160, redemptions: 27 },
  { period: "Jun 18", amount: 2640, redemptions: 33 },
  { period: "Jun 19", amount: 2240, redemptions: 28 },
  { period: "Jun 20", amount: 2960, redemptions: 37 }
];

export const demoCities = [
  { city: "Vijay Nagar", redemptions: 402, revenue: 214500 },
  { city: "Palasia", redemptions: 286, revenue: 151200 },
  { city: "Bhawarkua", redemptions: 241, revenue: 128950 },
  { city: "Rau", redemptions: 168, revenue: 90100 },
  { city: "New Palasia", redemptions: 122, revenue: 63400 }
];

export const demoHeatmap = [
  { lat: 22.7196, lng: 75.8577, weight: 94 },
  { lat: 22.7533, lng: 75.8937, weight: 72 },
  { lat: 22.7042, lng: 75.8498, weight: 58 },
  { lat: 22.6868, lng: 75.8272, weight: 44 }
];

export const demoRedemptions: Redemption[] = [
  { id: "red-1", redemption_code: "LD-9182", status: "confirmed", confirmed_at: now, bill_amount: 540, commission_amount: 80, geo_verified: true, campaign_name: "Campus Cold Brew Rush", creator_name: "Aarav Socials", customer_name: "Riya Sharma", customer_phone: "98xxxx2145", earning_status: "available" },
  { id: "red-2", redemption_code: "LD-7731", status: "confirmed", confirmed_at: "2026-06-19T18:10:00.000Z", bill_amount: 820, commission_amount: 65, geo_verified: true, campaign_name: "Weekend Waffle Drop", creator_name: "Foodie Rohan", customer_name: "Kabir Jain", customer_phone: "97xxxx1188", earning_status: "pending" },
  { id: "red-3", redemption_code: "LD-6408", status: "confirmed", confirmed_at: "2026-06-19T15:35:00.000Z", bill_amount: 399, commission_amount: 50, geo_verified: true, campaign_name: "Creator Latte Launch", creator_name: "Aarav Socials", customer_name: "Neha Patel", customer_phone: "88xxxx3312", earning_status: "paid" },
  { id: "red-4", redemption_code: "LD-5821", status: "confirmed", confirmed_at: "2026-06-18T20:22:00.000Z", bill_amount: 760, commission_amount: 80, geo_verified: false, campaign_name: "Campus Cold Brew Rush", creator_name: "Campus Pulse", customer_name: "Arjun Mehta", customer_phone: "99xxxx8001", earning_status: "available" }
];

export const demoCreatorEarnings: EarningsResponse = {
  summary: {
    total_earned: 19690,
    available_amount: 12840,
    pending_amount: 4850,
    paid_count: 2
  },
  earnings: [
    { campaign_name: "Campus Cold Brew Rush", business_name: "Neon Brew Cafe", amount: 11680, status: "available", confirmed_at: now },
    { campaign_name: "Weekend Waffle Drop", business_name: "Neon Brew Cafe", amount: 5460, status: "pending", confirmed_at: "2026-06-19T18:10:00.000Z" },
    { campaign_name: "Creator Latte Launch", business_name: "Neon Brew Cafe", amount: 2550, status: "paid", confirmed_at: "2026-06-18T15:35:00.000Z" }
  ],
  meta: { page: 1, limit: 20 }
};

export const demoCreatorPayoutEligibility: PayoutEligibility = {
  available_amount: 12840,
  minimum_payout: 1000,
  is_eligible: true,
  has_pending_payout: false,
  reason: null
};

export const demoCreatorPayouts: PayoutsResponse = {
  summary: { total_payouts: 3, total_paid: 7000, pending: 0 },
  payouts: [
    { requested_at: "2026-06-18T11:00:00.000Z", amount: 4000, payout_method: "upi", utr_number: "UTR90881273", status: "paid" },
    { requested_at: "2026-06-12T10:20:00.000Z", amount: 3000, payout_method: "upi", utr_number: "UTR77122031", status: "paid" },
    { requested_at: "2026-06-20T09:15:00.000Z", amount: 2500, payout_method: "upi", utr_number: "-", status: "processing" }
  ],
  meta: { page: 1, limit: 20 }
};

export const demoBusinessEarnings = {
  total_paid_out: 73125,
  pending_amount: 40875,
  available_amount: 154000,
  total_redemptions: 1219,
  unique_creators: 39
};

export const demoQrData: QRCodeData = {
  id: "demo-qr-1",
  campaign_id: "demo-campaign-1",
  creator_id: "demo-creator-profile",
  qr_token: "demo-token-1",
  qr_link: "http://localhost:3001/c/demo-token-1",
  scan_count: 3240,
  claim_count: 520
};

export const demoStoreLocations: StoreLocation[] = [
  { id: "store-1", business_id: "demo-business", branch_name: "Neon Brew Vijay Nagar", address: "56 Creator Street", city: "Indore", state: "Madhya Pradesh", lat: 22.7533, lng: 75.8937 },
  { id: "store-2", business_id: "demo-business", branch_name: "Neon Brew Palasia", address: "18 Market Lane", city: "Indore", state: "Madhya Pradesh", lat: 22.7042, lng: 75.8498 }
];

export const demoNotifications: AppNotification[] = [
  { id: "note-1", title: "New creator joined", description: "Aarav Socials joined Campus Cold Brew Rush.", type: "joined", is_read: false, created_at: now },
  { id: "note-2", title: "Payout ready", description: "Rs12,840 is available for payout.", type: "earning", is_read: false, created_at: "2026-06-20T08:00:00.000Z" },
  { id: "note-3", title: "Strong match found", description: "Street Bowl Co. is a 92% audience match.", type: "match", is_read: true, created_at: "2026-06-19T16:15:00.000Z" }
];

export const demoCreators = [
  {
    id: "creator-1",
    name: "Aarav Socials",
    niche: "Food reels, cafes, student hangouts",
    city: "Indore",
    followers: 38200,
    avg_redemptions: 146,
    match_score: 94,
    clusters: [
      { lat: 22.7533, lng: 75.8937, weight: 88, label: "Vijay Nagar students" },
      { lat: 22.7042, lng: 75.8498, weight: 62, label: "Palasia cafe crowd" },
      { lat: 22.7196, lng: 75.8577, weight: 54, label: "Central Indore followers" }
    ]
  },
  {
    id: "creator-2",
    name: "Foodie Rohan",
    niche: "Street food, lunch spots, value offers",
    city: "Indore",
    followers: 24600,
    avg_redemptions: 84,
    match_score: 88,
    clusters: [
      { lat: 22.6868, lng: 75.8272, weight: 76, label: "Bhawarkua food trail" },
      { lat: 22.7533, lng: 75.8937, weight: 58, label: "Office lunch audience" }
    ]
  },
  {
    id: "creator-3",
    name: "Campus Pulse",
    niche: "College life, group offers, budget cafes",
    city: "Indore",
    followers: 19200,
    avg_redemptions: 63,
    match_score: 83,
    clusters: [
      { lat: 22.7196, lng: 75.8577, weight: 80, label: "Campus belt" },
      { lat: 22.7042, lng: 75.8498, weight: 47, label: "Evening hangouts" }
    ]
  }
];

export const demoMatches = [
  {
    id: "biz-match-1",
    business_id: "demo-business",
    campaign_id: "demo-campaign-1",
    name: "Neon Brew Cafe",
    business_name: "Neon Brew Cafe",
    creator_id: "creator-1",
    creator_name: "Aarav Socials",
    category: "Cafe",
    area: "Vijay Nagar",
    lat: 22.7533,
    lng: 75.8937,
    score: 94,
    match_score: 94,
    distance: "1.8 km",
    redemptions: 146,
    active: true,
    already_joined: true,
    reason: "Food audience, student-heavy reach, and strong cafe redemption history.",
    signals: { geo: 96, content: 91, conversion: 88, affinity: 93 }
  },
  {
    id: "biz-match-2",
    business_id: "demo-business-2",
    campaign_id: "demo-campaign-5",
    name: "Street Bowl Co.",
    business_name: "Street Bowl Co.",
    creator_id: "creator-2",
    creator_name: "Foodie Rohan",
    category: "Food",
    area: "Bhawarkua",
    lat: 22.6868,
    lng: 75.8272,
    score: 88,
    match_score: 88,
    distance: "2.4 km",
    redemptions: 104,
    active: true,
    already_joined: false,
    reason: "Lunch content performs well with nearby office crowd.",
    signals: { geo: 89, content: 86, conversion: 83, affinity: 92 }
  },
  {
    id: "biz-match-3",
    business_id: "demo-business-3",
    campaign_id: "demo-campaign-6",
    name: "Urban Threads",
    business_name: "Urban Threads",
    creator_id: "creator-3",
    creator_name: "Campus Pulse",
    category: "Fashion",
    area: "Palasia",
    lat: 22.7042,
    lng: 75.8498,
    score: 81,
    match_score: 81,
    distance: "3.1 km",
    redemptions: 67,
    active: true,
    already_joined: false,
    reason: "Campus audience has strong weekend fashion shopping overlap.",
    signals: { geo: 78, content: 80, conversion: 76, affinity: 90 }
  }
];
