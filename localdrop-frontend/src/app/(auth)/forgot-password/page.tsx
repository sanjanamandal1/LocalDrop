"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiError, api } from "@/lib/api";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { useI18n } from "@/i18n/provider";

type EmailForm = { email: string };
type OtpForm = { code: string };
type ResetForm = { password: string; confirmPassword: string };

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "reset" | "success">("email");
  const [email, setEmail] = useState("");

  const emailSchema = useMemo(() => z.object({
    email: z.string().email(t("validation.invalidEmail")),
  }), [t]);

  const otpSchema = useMemo(() => z.object({
    code: z.string().length(6, "Verification code must be exactly 6 digits."),
  }), []);

  const resetSchema = useMemo(() => z.object({
    password: z.string().min(8, t("validation.passwordMin")),
    confirmPassword: z.string().min(8, t("validation.passwordMin")),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("validation.passwordsDoNotMatch"),
    path: ["confirmPassword"],
  }), [t]);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  async function onEmailSubmit(values: EmailForm) {
    try {
      await api.post("/auth/forgot-password-verify", { email: values.email });
      setEmail(values.email);
      setStep("otp");
    } catch (error) {
      emailForm.setError("root", { message: apiError(error) });
    }
  }

  async function onOtpSubmit(values: OtpForm) {
    if (values.code === "123456") {
      setStep("reset");
    } else {
      otpForm.setError("code", { message: "Invalid verification code. Use the demo code 123456!" });
    }
  }

  async function onResetSubmit(values: ResetForm) {
    try {
      await api.post("/auth/reset-password", { email, password: values.password });
      setStep("success");
    } catch (error) {
      resetForm.setError("root", { message: apiError(error) });
    }
  }

  return (
    <main className="ld-app-shell relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 text-foreground">
      <div className="ld-app-grid absolute inset-0 pointer-events-none" />
      <Card className="z-10 w-full max-w-md bg-card">
        <CardContent className="p-8">
          <div className="mb-8 flex items-center gap-3 text-2xl font-black">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-pink)] text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="gradient-text-animated">LocalDrop</span>
          </div>
          <div className="mb-6 flex items-center justify-end gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          {step === "email" && (
            <>
              <h1 className="text-3xl font-black tracking-tight text-foreground">{t("auth.resetTitle")}</h1>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {t("auth.resetHelp")}
              </p>
              <form className="mt-8 space-y-4" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
                <div>
                  <Input placeholder={t("common.email")} type="email" {...emailForm.register("email")} />
                  {emailForm.formState.errors.email ? (
                    <p className="mt-2 text-xs font-black text-red-600">{emailForm.formState.errors.email.message}</p>
                  ) : null}
                </div>
                {emailForm.formState.errors.root ? (
                  <p className="rounded-[14px] border-2 border-[var(--ld-ink)] bg-[var(--ld-red)] px-3 py-2 text-sm font-black text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">{emailForm.formState.errors.root.message}</p>
                ) : null}
                <Button className="w-full" disabled={emailForm.formState.isSubmitting}>
                  {emailForm.formState.isSubmitting ? t("auth.checking") : t("action.continue")}
                </Button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h1 className="text-3xl font-black tracking-tight text-foreground">Verify OTP</h1>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                We've sent a 6-digit verification code to <span className="font-black text-foreground">{email}</span>.
              </p>
              
              <div className="mt-4 rounded-[16px] border-2 border-[var(--ld-ink)] bg-[var(--ld-lime)] p-3.5 text-xs font-semibold text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">
                <span className="font-black">Demo Mode:</span> Enter code 123456 to proceed.
              </div>

              <form className="mt-6 space-y-4" onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
                <div>
                  <Input placeholder="Enter 6-digit code" type="text" maxLength={6} {...otpForm.register("code")} />
                  {otpForm.formState.errors.code ? (
                    <p className="mt-2 text-xs font-black text-red-600">{otpForm.formState.errors.code.message}</p>
                  ) : null}
                </div>
                <Button className="w-full">
                  Verify Code
                </Button>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <h1 className="text-3xl font-black tracking-tight text-foreground">{t("auth.createNewPassword")}</h1>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {t("auth.setPasswordFor", { email })}
              </p>
              <form className="mt-8 space-y-4" onSubmit={resetForm.handleSubmit(onResetSubmit)}>
                <div>
                  <Input placeholder={t("auth.newPassword")} type="password" {...resetForm.register("password")} />
                  {resetForm.formState.errors.password ? (
                    <p className="mt-2 text-xs font-black text-red-600">{resetForm.formState.errors.password.message}</p>
                  ) : null}
                </div>
                <div>
                  <Input placeholder={t("auth.confirmNewPassword")} type="password" {...resetForm.register("confirmPassword")} />
                  {resetForm.formState.errors.confirmPassword ? (
                    <p className="mt-2 text-xs font-black text-red-600">{resetForm.formState.errors.confirmPassword.message}</p>
                  ) : null}
                </div>
                {resetForm.formState.errors.root ? (
                  <p className="rounded-[14px] border-2 border-[var(--ld-ink)] bg-[var(--ld-red)] px-3 py-2 text-sm font-black text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">{resetForm.formState.errors.root.message}</p>
                ) : null}
                <Button className="w-full" disabled={resetForm.formState.isSubmitting}>
                  {resetForm.formState.isSubmitting ? t("auth.resetting") : t("action.resetPassword")}
                </Button>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--ld-mint)]" />
              <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground">{t("auth.passwordResetComplete")}</h1>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {t("auth.passwordUpdated")}
              </p>
              <Button className="mt-6 w-full" onClick={() => router.push("/login")}>
                {t("action.signIn")}
              </Button>
            </div>
          )}

          {step !== "success" && (
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-1 text-sm font-black text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" /> {t("action.backToSignIn")}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
