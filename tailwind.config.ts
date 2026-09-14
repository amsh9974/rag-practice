import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b3cdff",
          300: "#80adff",
          400: "#4d8dff",
          500: "#2166f0",
          600: "#1750c2",
          700: "#123d94",
          800: "#0f3277",
          900: "#0c275e",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,18,32,0.04), 0 8px 24px -12px rgba(11,18,32,0.12)",
        "card-hover": "0 4px 12px rgba(11,18,32,0.06), 0 16px 32px -12px rgba(11,18,32,0.16)",
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(11,18,32,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,18,32,0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
