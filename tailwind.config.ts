import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bronze: {
          DEFAULT: "#9A6A3A",
          deep: "#6F4726",
          light: "#B9854D",
        },
        ivory: "#FFFDF8",
        cream: "#F8F3EC",
        coffee: "#18110C",
        "warm-gray": "#8C8178",
      },
      borderColor: {
        hairline: "rgba(154, 106, 58, 0.18)",
        "hairline-strong": "rgba(154, 106, 58, 0.32)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(24, 17, 12, 0.04), 0 8px 24px rgba(24, 17, 12, 0.06)",
        lifted:
          "0 2px 4px rgba(24, 17, 12, 0.05), 0 16px 40px rgba(111, 71, 38, 0.10)",
        glow: "0 0 0 1px rgba(154, 106, 58, 0.18), 0 12px 40px rgba(154, 106, 58, 0.14)",
      },
      letterSpacing: {
        caps: "0.14em",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
