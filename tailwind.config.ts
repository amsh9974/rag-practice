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
    },
  },
  plugins: [],
};

export default config;
