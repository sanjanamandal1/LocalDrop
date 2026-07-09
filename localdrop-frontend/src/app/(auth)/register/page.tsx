"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, MapPin, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UseCurrentLocationButton } from "@/components/settings/UseCurrentLocationButton";
import { apiError } from "@/lib/api";
import { authService } from "@/lib/services";
import { useAuthStore } from "@/store/auth";
import { geocodeCityState } from "@/services/geocode";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { useI18n } from "@/i18n/provider";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  role: "creator" | "business";
  city?: string;
  state?: string;
  lat?: string;
  lng?: string;
};

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const schema = useMemo(() => z.object({
    name: z.string().min(2),
    email: z.string().email(t("validation.invalidEmail")),
    password: z.string().min(8, t("validation.passwordMin")),
    role: z.enum(["creator", "business"]),
    city: z.string().optional(),
    state: z.string().optional(),
    lat: z.string().optional(),
    lng: z.string().optional(),
  }), [t]);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, setValue, watch } = useForm<RegisterForm>({ resolver: zodResolver(schema), defaultValues: { role: "creator" } });
  const selectedRole = watch("role");

  async function onSubmit(values: RegisterForm) {
    try {
      let lat = values.lat;
      let lng = values.lng;

      if ((!lat || !lng) && values.city) {
        const coords = await geocodeCityState(values.city, values.state);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      const session = await authService.register({
        ...values,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
      });
      setSession({ ...session, profile: null });
      router.replace(`/${session.user.role}/profile`);
    } catch (error) {
      setError("root", { message: apiError(error) });
    }
  }

  return (
    <main className="ld-app-shell relative grid min-h-screen place-items-center overflow-hidden px-4 py-8 text-foreground">
      <div className="ld-app-grid absolute inset-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="z-10 w-full max-w-lg"
      >
        <Card className="rotate-[0.6deg] bg-card">
          <CardContent className="p-8">
            <div className="mb-8 flex items-center gap-3 text-2xl font-black tracking-tight">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-pink)] text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <span className="gradient-text-animated">LocalDrop</span>
                <p className="mt-1 rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-mint)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#08050f] shadow-[2px_3px_0_var(--ld-ink)]">
                  Start dropping traffic
                </p>
              </div>
            </div>
            <div className="mb-6 flex items-center justify-end gap-3">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <h1 className="text-3xl font-black tracking-tight">{t("auth.createAccountTitle")}</h1>
            <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <div className="sm:col-span-2">
                <input type="hidden" {...register("role")} />
                <div className="grid gap-3 rounded-[22px] border-2 border-[var(--ld-ink)] bg-[var(--ld-cream)] p-2 shadow-[4px_5px_0_var(--ld-ink)] sm:grid-cols-2">
                  {([
                    {
                      value: "creator" as const,
                      icon: UserRound,
                      title: t("common.roleCreator"),
                      body: "Earn from campaigns and share offers."
                    },
                    {
                      value: "business" as const,
                      icon: Building2,
                      title: t("common.roleBusiness"),
                      body: "Launch campaigns and drive store visits."
                    }
                  ]).map((option) => {
                    const Icon = option.icon;
                    const active = selectedRole === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValue("role", option.value, { shouldDirty: true, shouldValidate: true })}
                        className={[
                          "rounded-[18px] border-2 border-[var(--ld-ink)] p-3 text-left transition-all active:translate-x-1 active:translate-y-1 active:shadow-none",
                          active
                            ? "bg-[var(--ld-pink)] text-[#08050f] shadow-[4px_5px_0_var(--ld-ink)]"
                            : "bg-[var(--ld-surface)] text-foreground hover:-translate-y-0.5 hover:shadow-[3px_4px_0_var(--ld-ink)]"
                        ].join(" ")}
                        aria-pressed={active}
                      >
                        <span className="flex items-center gap-2 text-sm font-black">
                          <Icon className="h-4 w-4" />
                          {option.title}
                        </span>
                        <span className="mt-1 block text-xs font-semibold opacity-75">{option.body}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.role && <p className="mt-2 text-xs font-black text-red-600">{errors.role.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <Input 
                  placeholder={selectedRole === "business" ? "Business name" : "Creator name"} 
                  {...register("name")} 
                />
                {errors.name && <p className="mt-2 text-xs font-black text-red-600">{errors.name.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <Input 
                  placeholder={t("common.email")} 
                  type="email" 
                  {...register("email")} 
                />
                {errors.email && <p className="mt-2 text-xs font-black text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <Input 
                  placeholder={t("common.password")} 
                  type="password" 
                  {...register("password")} 
                />
                {errors.password && <p className="mt-2 text-xs font-black text-red-600">{errors.password.message}</p>}
              </div>
              <div>
                <Input 
                  placeholder={t("common.city")} 
                  {...register("city")} 
                />
                {errors.city && <p className="mt-2 text-xs font-black text-red-600">{errors.city.message}</p>}
              </div>
              <div>
                <Input 
                  placeholder={t("common.state")} 
                  {...register("state")} 
                />
                {errors.state && <p className="mt-2 text-xs font-black text-red-600">{errors.state.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <UseCurrentLocationButton
                  onLocation={(vals) => {
                    if (vals.city) setValue("city", vals.city, { shouldValidate: true });
                    if (vals.state) setValue("state", vals.state, { shouldValidate: true });
                    if (vals.lat) setValue("lat", vals.lat, { shouldValidate: true });
                    if (vals.lng) setValue("lng", vals.lng, { shouldValidate: true });
                  }}
                />
              </div>
              <input type="hidden" {...register("lat")} />
              <input type="hidden" {...register("lng")} />
              {Object.values(errors).length ? (
                <p className="sm:col-span-2 rounded-[14px] border-2 border-[var(--ld-ink)] bg-[var(--ld-red)] px-3 py-2 text-sm font-black text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">
                  {errors.root?.message || t("validation.checkHighlighted")}
                </p>
              ) : null}
              <Button 
                className="sm:col-span-2" 
                disabled={isSubmitting}
              >
                {isSubmitting ? t("auth.creating") : t("action.createAccount")}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm font-semibold text-muted-foreground">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link className="font-black text-primary transition hover:underline" href="/login">
                {t("action.signIn")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
