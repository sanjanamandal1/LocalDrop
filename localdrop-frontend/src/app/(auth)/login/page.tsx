"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiError } from "@/lib/api";
import { authService } from "@/lib/services";
import { useAuthStore } from "@/store/auth";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { useI18n } from "@/i18n/provider";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const schema = useMemo(() => z.object({
    email: z.string().email(t("validation.invalidEmail")),
    password: z.string().min(1, t("validation.passwordRequired"))
  }), [t]);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  async function onSubmit(values: LoginForm) {
    try {
      const session = await authService.login(values);
      setSession(session);
      router.replace(`/${session.user.role}`);
    } catch (error) {
      setError("root", { message: apiError(error) });
    }
  }

  return (
    <main className="ld-app-shell relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 text-foreground">
      <div className="ld-app-grid absolute inset-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="z-10 w-full max-w-md"
      >
        <Card className="rotate-[-0.7deg] bg-card">
          <CardContent className="p-8">
            <div className="mb-8 flex items-center gap-3 text-2xl font-black tracking-tight">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-pink)] text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <span className="gradient-text-animated">LocalDrop</span>
                <p className="mt-1 rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-lime)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#08050f] shadow-[2px_3px_0_var(--ld-ink)]">
                  Creator footfall engine
                </p>
              </div>
            </div>
            <div className="mb-6 flex items-center justify-end gap-3">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <h1 className="text-3xl font-black tracking-tight">{t("auth.backWelcome")}</h1>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">{t("auth.signInDashboard")}</p>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Input 
                  placeholder={t("common.email")} 
                  type="email" 
                  {...register("email")} 
                />
                {errors.email ? <p className="mt-2 text-xs font-black text-red-600">{errors.email.message}</p> : null}
              </div>
              <div>
                <div className="relative">
                  <Input 
                    placeholder={t("common.password")} 
                    type={showPassword ? "text" : "password"} 
                    className="pr-11"
                    {...register("password")} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-2.5 flex justify-end">
                  <Link className="text-xs font-black text-primary transition hover:underline" href="/forgot-password">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                {errors.password ? <p className="mt-2 text-xs font-black text-red-600">{errors.password.message}</p> : null}
              </div>
              {errors.root ? <p className="rounded-[14px] border-2 border-[var(--ld-ink)] bg-[var(--ld-red)] px-3 py-2 text-sm font-black text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">{errors.root.message}</p> : null}
              <Button 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? t("auth.signingIn") : t("action.signIn")}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm font-semibold text-muted-foreground">
              {t("auth.newHere")}{" "}
              <Link className="font-black text-primary transition hover:underline" href="/register">
                {t("action.createAccount")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
