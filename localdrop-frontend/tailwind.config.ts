import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          purple: "#6D28D9",
          "purple-light": "#8B5CF6",
        },
        settings: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E5E7EB",
          text: "#111827",
          muted: "#6B7280",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(31, 20, 73, 0.06)"
      }
    }
  },
  plugins: [animate]
};

export default config;
