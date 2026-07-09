"use client";

import Link from "next/link";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart3, Bell, BellOff, CreditCard, Gift, Home, LogOut, MapPin, QrCode, Radar, Settings, User, WalletCards, X, Send, Coins, Info, Trash2, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { ProfileUploader } from "@/components/settings/ProfileUploader";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { api, apiError } from "@/lib/api";
import { analyticsService, campaignService, earningsService, notificationService, payoutService, settingsService } from "@/lib/services";
import { useI18n } from "@/i18n/provider";
import type { TranslationKey } from "@/i18n/config";
import type { BusinessProfile, CreatorProfile, Role } from "@/types/api";

const businessNav = [
  { href: "/business", labelKey: "nav.dashboard", icon: Home },
  { href: "/business/campaigns", labelKey: "nav.campaigns", icon: Gift },
  { href: "/business/analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { href: "/business/earnings", labelKey: "nav.earnings", icon: WalletCards },
  { href: "/business/redemptions", labelKey: "nav.redemptions", icon: QrCode },
  { href: "/business/profile", labelKey: "nav.profile", icon: User },
  { href: "/business/settings", labelKey: "nav.settings", icon: Settings }
];

const creatorNav = [
  { href: "/creator", labelKey: "nav.dashboard", icon: Home },
  { href: "/creator/match", labelKey: "nav.matchMap", icon: Radar },
  { href: "/creator/campaigns/available", labelKey: "nav.campaigns", icon: Gift },
  { href: "/creator/campaigns/joined", labelKey: "nav.joined", icon: QrCode },
  { href: "/creator/qr", labelKey: "nav.qr", icon: QrCode },
  { href: "/creator/analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { href: "/creator/earnings", labelKey: "nav.earnings", icon: WalletCards },
  { href: "/creator/profile", labelKey: "nav.profile", icon: User },
  { href: "/creator/settings", labelKey: "nav.settings", icon: Settings }
];

const adminNav = [
  { href: "/admin", labelKey: "nav.dashboard", icon: Home },
  { href: "/admin/users", labelKey: "admin.users", icon: User },
  { href: "/admin/disputes", labelKey: "admin.disputes", icon: Info },
  { href: "/admin/payouts", labelKey: "admin.payouts", icon: CreditCard },
];

export function Sidebar({ role }: { role: Role }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { profile, clear } = useAuthStore();
  const [showReferModal, setShowReferModal] = useState(false);
  const [referName, setReferName] = useState("");
  const [referEmail, setReferEmail] = useState("");
  const [referSending, setReferSending] = useState(false);

  const nav = role === "business" ? businessNav : role === "admin" ? adminNav : creatorNav;
  const name = role === "business" ? (profile as { business_name?: string } | null)?.business_name : (profile as { name?: string } | null)?.name;
  const city = (profile as { city?: string } | null)?.city;

  const prefetchRoute = (href: string) => {
    router.prefetch(href);

    if (href === "/business") {
      void qc.prefetchQuery({ queryKey: ["business-overview"], queryFn: analyticsService.businessOverview });
      void qc.prefetchQuery({ queryKey: ["business-timeline"], queryFn: analyticsService.businessTimeline });
      void qc.prefetchQuery({ queryKey: ["business-cities"], queryFn: analyticsService.businessCities });
      void qc.prefetchQuery({ queryKey: ["business-campaigns"], queryFn: () => campaignService.businessMine() });
    } else if (href === "/business/campaigns") {
      void qc.prefetchQuery({ queryKey: ["business-campaigns"], queryFn: () => campaignService.businessMine() });
    } else if (href === "/business/analytics") {
      void qc.prefetchQuery({ queryKey: ["business-overview"], queryFn: analyticsService.businessOverview });
      void qc.prefetchQuery({ queryKey: ["business-campaign-stats"], queryFn: analyticsService.businessCampaigns });
      void qc.prefetchQuery({ queryKey: ["business-timeline"], queryFn: analyticsService.businessTimeline });
      void qc.prefetchQuery({ queryKey: ["business-cities"], queryFn: analyticsService.businessCities });
    } else if (href === "/business/earnings") {
      void qc.prefetchQuery({ queryKey: ["business-earnings"], queryFn: earningsService.business });
      void qc.prefetchQuery({ queryKey: ["business-campaign-stats"], queryFn: analyticsService.businessCampaigns });
    } else if (href === "/business/redemptions") {
      void qc.prefetchQuery({ queryKey: ["business-redemptions"], queryFn: analyticsService.businessRedemptions });
    } else if (href === "/business/settings" || href === "/creator/settings") {
      void qc.prefetchQuery({ queryKey: ["settings"], queryFn: settingsService.get });
    } else if (href === "/creator") {
      void qc.prefetchQuery({ queryKey: ["creator-overview"], queryFn: analyticsService.creatorOverview });
      void qc.prefetchQuery({ queryKey: ["creator-campaigns"], queryFn: campaignService.creatorMine });
      void qc.prefetchQuery({ queryKey: ["creator-earnings-timeline"], queryFn: earningsService.creatorTimeline });
    } else if (href === "/creator/campaigns/available") {
      void qc.prefetchQuery({ queryKey: ["nearby", 22.7196, 75.8577], queryFn: () => campaignService.nearby({ lat: 22.7196, lng: 75.8577, radius: 10 }) });
    } else if (href === "/creator/campaigns/joined" || href === "/creator/qr") {
      void qc.prefetchQuery({ queryKey: ["creator-campaigns"], queryFn: campaignService.creatorMine });
    } else if (href === "/creator/analytics") {
      void qc.prefetchQuery({ queryKey: ["creator-overview"], queryFn: analyticsService.creatorOverview });
      void qc.prefetchQuery({ queryKey: ["creator-campaign-stats"], queryFn: analyticsService.creatorCampaigns });
      void qc.prefetchQuery({ queryKey: ["creator-heatmap"], queryFn: analyticsService.creatorHeatmap });
    } else if (href === "/creator/earnings") {
      void qc.prefetchQuery({ queryKey: ["creator-earnings"], queryFn: earningsService.creator });
      void qc.prefetchQuery({ queryKey: ["creator-earnings-timeline"], queryFn: earningsService.creatorTimeline });
      void qc.prefetchQuery({ queryKey: ["creator-earnings-campaign"], queryFn: earningsService.creatorByCampaign });
      void qc.prefetchQuery({ queryKey: ["payout-eligibility"], queryFn: payoutService.eligibility });
      void qc.prefetchQuery({ queryKey: ["creator-payouts"], queryFn: payoutService.creator });
    } else if (href === "/creator/match") {
      void qc.prefetchQuery({ queryKey: ["creators-list"], queryFn: campaignService.creators });
    }
  };

  useEffect(() => {
    nav.forEach((item) => router.prefetch(item.href));
  }, [nav, router]);

  const handleReferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referName || !referEmail) {
      toast.error(t("toast.fillAllFields"));
      return;
    }
    setReferSending(true);

    try {
      await api.post("/referrals/invite", {
        businessName: referName,
        email: referEmail,
        senderName: name || "A LocalDrop Creator"
      });

      toast.success(t("toast.referralSent", { name: referName }));
      setShowReferModal(false);
      setReferName("");
      setReferEmail("");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setReferSending(false);
    }
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col border-r-2 border-[var(--ld-ink)] bg-[var(--ld-cream)] px-4 py-5 shadow-[10px_0_0_var(--ld-ink)] lg:flex">
        <div className="mb-8">
          <Link href={`/${role}`} className="flex items-center gap-2 text-2xl font-black tracking-tight">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-pink)] text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="gradient-text-animated">LocalDrop</span>
          </Link>
          <p className="mt-2 rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-lime)] px-2 py-1 text-[9px] font-black uppercase leading-relaxed tracking-[0.12em] text-[#08050f] shadow-[2px_3px_0_var(--ld-ink)]">
            From creator reach to store visits
          </p>
        </div>
        <div className="mb-5 rounded-[18px] border-2 border-[var(--ld-ink)] bg-[var(--ld-surface)] p-3 shadow-[4px_5px_0_var(--ld-ink)]">
          <p className="inline-flex rounded-full bg-[var(--ld-sky)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#08050f]">{role}</p>
          <p className="mt-2 truncate text-sm font-black text-foreground">{name || t("sidebar.defaultUser")}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-[var(--ld-red)]" />{city || t("sidebar.setLocation")}</p>
        </div>
        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1 min-h-0 scrollbar-thin mb-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
            return (
              <Link 
                className={cn(
                  "flex items-center gap-3 rounded-full border-2 border-transparent px-3 py-2.5 text-sm font-black text-foreground/75 transition duration-150 hover:border-[var(--ld-ink)] hover:bg-[var(--ld-surface)] hover:text-foreground hover:shadow-[3px_4px_0_var(--ld-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none",
                  active && "border-[var(--ld-ink)] bg-[var(--ld-pink)] text-[#08050f] shadow-[4px_5px_0_var(--ld-ink)]"
                )} 
                href={item.href} 
                key={item.href}
                prefetch
                onFocus={() => prefetchRoute(item.href)}
                onMouseEnter={() => prefetchRoute(item.href)}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey as TranslationKey)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-[18px] border-2 border-[var(--ld-ink)] bg-[var(--ld-mint)] p-4 text-[#08050f] shadow-[4px_5px_0_var(--ld-ink)]">
          <p className="text-sm font-black">{t("sidebar.referBusiness")}</p>
          <p className="mt-1 text-xs font-semibold text-[#08050f]/75">{t("sidebar.visibility")}</p>
          <Button
            className="mt-3 w-full justify-start bg-[var(--ld-surface)]"
            variant="outline"
            size="sm"
            onClick={() => setShowReferModal(true)}
          >
            {t("action.referNow")}
          </Button>
        </div>
        <button
          className="mt-4 flex items-center gap-3 rounded-full border-2 border-transparent px-3 py-2 text-sm font-black text-foreground/75 transition hover:border-[var(--ld-ink)] hover:bg-[var(--ld-surface)] hover:text-foreground hover:shadow-[3px_4px_0_var(--ld-ink)]"
          onClick={() => {
            qc.clear();
            clear();
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4" /> {t("sidebar.logout")}
        </button>
      </aside>

      {/* Referral Modal */}
      {showReferModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowReferModal(false)}
          />
          <div className="glow-border-card relative w-full max-w-md transform overflow-hidden rounded-[24px] bg-card p-6 text-left align-middle transition-all">
            <button
              onClick={() => setShowReferModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold text-foreground">{t("sidebar.referTitle")}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t("sidebar.referDescription")}
            </p>
            <form onSubmit={handleReferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("common.businessName")}</label>
                <input
                  type="text"
                  placeholder="e.g. Chai Adda"
                  required
                  value={referName}
                  onChange={(e) => setReferName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("common.businessEmail")}</label>
                <input
                  type="email"
                  placeholder="name@business.com"
                  required
                  value={referEmail}
                  onChange={(e) => setReferEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button className="w-full mt-2" disabled={referSending}>
                {referSending ? (
                  <>{t("common.sending")}</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> {t("action.sendReferral")}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'joined' | 'earning' | 'match' | 'info';
  read: boolean;
}

export function Topbar({ title, action }: { title: string; action?: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { user, profile } = useAuthStore();
  const role = user?.role;
  const photoUrl = role === "business"
    ? (profile as BusinessProfile | null)?.profile_photo_url || (profile as BusinessProfile | null)?.logo_url
    : (profile as CreatorProfile | null)?.profile_photo_url || (profile as CreatorProfile | null)?.avatar_url;

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: notificationService.list,
    enabled: Boolean(user),
  });
  const notifications: NotificationItem[] = (notificationsQuery.data || []).map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    type: n.type,
    read: n.is_read,
    time: new Date(n.created_at).toLocaleDateString(),
  }));
  const markRead = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
  const clearFeed = useMutation({
    mutationFn: notificationService.clear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  // Click outside handler to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="mb-7 flex items-center justify-between gap-3 rounded-[26px] border-2 border-[var(--ld-ink)] bg-[var(--ld-surface)] px-4 py-3 shadow-[6px_7px_0_var(--ld-ink)]">
      <div>
        <p className="mb-1 inline-flex rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-amber)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#08050f] shadow-[2px_3px_0_var(--ld-ink)]">
          Live workspace
        </p>
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">{title}</h1>
        {(pathname === "/creator" || pathname === "/business" || pathname === "/creator/" || pathname === "/business/") && (
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{t("sidebar.subtitle")}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {action}
        <LanguageToggle />
        <ThemeToggle />
        
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button 
            size="icon" 
            variant="outline" 
            className="relative"
            aria-label={t("settings.notifications")}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-red)] text-[10px] font-black leading-none text-[#08050f]">
                {unreadCount}
              </span>
            )}
          </Button>

          {notificationsOpen && (
            <div className="glow-border-card absolute right-0 z-[999] mt-3 w-80 rounded-[24px] bg-card p-4 transition duration-200">
              <div className="mb-3 flex items-center justify-between border-b-2 border-[var(--ld-ink)] pb-2">
                <h3 className="text-sm font-black text-foreground">{t("settings.notifications") || "Notifications"}</h3>
                {notifications.length > 0 && (
                  <button 
                    className="flex items-center gap-1 text-xs font-black text-muted-foreground transition hover:text-foreground"
                    onClick={() => clearFeed.mutate()}
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear all
                  </button>
                )}
              </div>
              
              <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <BellOff className="h-8 w-8 opacity-45 mb-2" />
                    <p className="text-xs">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={cn(
                        "flex cursor-pointer select-none gap-3 rounded-[16px] border-2 p-3 text-left transition hover:-translate-y-0.5",
                        notif.read
                          ? "border-[var(--ld-ink)] bg-[var(--ld-surface)]"
                          : "border-[var(--ld-ink)] bg-[var(--ld-lime)] shadow-[3px_4px_0_var(--ld-ink)]"
                      )}
                      onClick={() => markRead.mutate(notif.id)}
                      role="button"
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'joined' ? <Check className="h-4 w-4 text-emerald-500" /> :
                         notif.type === 'earning' ? <Coins className="h-4 w-4 text-amber-500" /> :
                         notif.type === 'match' ? <Sparkles className="h-4 w-4 text-indigo-500" /> :
                         <Info className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start w-full gap-2">
                          <p className="text-xs font-black leading-tight text-foreground">{notif.title}</p>
                          <span className="mt-0.5 shrink-0 text-[9px] font-bold text-muted-foreground">{notif.time}</span>
                        </div>
                        <p className="text-[11px] font-semibold leading-normal text-muted-foreground">{notif.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user && (role === "creator" || role === "business") ? (
          <ProfileUploader userId={user.id} role={role} photoUrl={photoUrl} size="sm" />
        ) : null}
      </div>
    </div>
  );
}
