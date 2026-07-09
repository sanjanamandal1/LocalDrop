"use client";

import { keepPreviousData, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { I18nProvider } from "@/i18n/provider";

const AIAssistant = dynamic(
  () => import("@/components/dashboard/ai-assistant").then((mod) => mod.AIAssistant),
  { ssr: false }
);

export function Providers({ children }: { children: ReactNode }) {
  const [assistantReady, setAssistantReady] = useState(false);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60_000,
            gcTime: 30 * 60_000,
            placeholderData: keepPreviousData,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  );

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    const idle = window.requestIdleCallback?.(() => setAssistantReady(true), { timeout: 2500 });
    const fallback = window.setTimeout(() => setAssistantReady(true), 2500);
    return () => {
      if (idle) window.cancelIdleCallback?.(idle);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <I18nProvider>
      <QueryClientProvider client={client}>
        {children}
        {assistantReady ? <AIAssistant /> : null}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </I18nProvider>
  );
}
