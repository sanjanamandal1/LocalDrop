"use client";

import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && systemPrefersDark)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="text-foreground border-border bg-card hover:bg-muted"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
      ) : (
        <Sun className="h-4 w-4 text-amber-500" />
      )}
    </Button>
  );
}
