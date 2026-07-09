import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analyticsService, campaignService, earningsService, payoutService, profileService, qrService } from "@/lib/services";
import { useAuthStore } from "@/store/auth";
import type { Campaign } from "@/types/api";

export const qk = {
  profile: (role?: string, userId?: string) => ["profile", role, userId],
  businessCampaigns: ["business-campaigns"],
  creatorCampaigns: ["creator-campaigns"],
  nearby: (lat?: number, lng?: number) => ["nearby", lat, lng],
  qr: (id?: string) => ["qr", id],
  businessOverview: ["business-overview"],
  creatorOverview: ["creator-overview"]
};

export function useProfile(role?: "creator" | "business") {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: qk.profile(role, userId),
    queryFn: () => profileService.get(role!),
    enabled: Boolean(role) && Boolean(userId)
  });
}

export function useBusinessCampaigns() {
  return useQuery({ queryKey: qk.businessCampaigns, queryFn: () => campaignService.businessMine() });
}

export function useCreatorCampaigns() {
  return useQuery({ queryKey: qk.creatorCampaigns, queryFn: campaignService.creatorMine });
}

export function useNearbyCampaigns(lat?: number, lng?: number) {
  return useQuery({ queryKey: qk.nearby(lat, lng), queryFn: () => campaignService.nearby({ lat: lat!, lng: lng!, radius: 10 }), enabled: lat != null && lng != null });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Campaign>) => campaignService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.businessCampaigns })
  });
}

export function useJoinCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignService.join(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.creatorCampaigns });
      qc.invalidateQueries({ queryKey: ["nearby"] });
    }
  });
}

export function useCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" | "ended" }) => campaignService.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.businessCampaigns })
  });
}

export function useCreatorQR(campaignId?: string) {
  return useQuery({ queryKey: qk.qr(campaignId), queryFn: () => qrService.getCreatorQR(campaignId!), enabled: Boolean(campaignId) });
}

export function useBusinessDashboardData() {
  return {
    overview: useQuery({ queryKey: qk.businessOverview, queryFn: analyticsService.businessOverview }),
    campaigns: useQuery({ queryKey: ["business-campaign-stats"], queryFn: analyticsService.businessCampaigns }),
    timeline: useQuery({ queryKey: ["business-timeline"], queryFn: analyticsService.businessTimeline }),
    cities: useQuery({ queryKey: ["business-cities"], queryFn: analyticsService.businessCities })
  };
}

export function useCreatorDashboardData() {
  return {
    overview: useQuery({ queryKey: qk.creatorOverview, queryFn: analyticsService.creatorOverview }),
    campaigns: useQuery({ queryKey: ["creator-campaign-stats"], queryFn: analyticsService.creatorCampaigns }),
    heatmap: useQuery({ queryKey: ["creator-heatmap"], queryFn: analyticsService.creatorHeatmap })
  };
}

export function useCreatorEarningsData() {
  return {
    earnings: useQuery({ queryKey: ["creator-earnings"], queryFn: earningsService.creator }),
    timeline: useQuery({ queryKey: ["creator-earnings-timeline"], queryFn: earningsService.creatorTimeline }),
    byCampaign: useQuery({ queryKey: ["creator-earnings-campaign"], queryFn: earningsService.creatorByCampaign })
  };
}

export function useCreatorPayoutData() {
  return {
    eligibility: useQuery({ queryKey: ["payout-eligibility"], queryFn: payoutService.eligibility }),
    payouts: useQuery({ queryKey: ["creator-payouts"], queryFn: payoutService.creator })
  };
}

export function useCreatorMatches(creatorId?: string) {
  return useQuery({
    queryKey: ["creator-matches", creatorId],
    queryFn: () => campaignService.matches({ creator_id: creatorId })
  });
}

export function useCreatorsList() {
  return useQuery({
    queryKey: ["creators-list"],
    queryFn: () => campaignService.creators()
  });
}

export function useCreateMatchCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ businessId, creatorId }: { businessId: string; creatorId?: string }) => campaignService.createMatchCampaign(businessId, creatorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creator-matches"] });
      qc.invalidateQueries({ queryKey: ["creator-campaigns"] });
      qc.invalidateQueries({ queryKey: ["nearby"] });
    }
  });
}
