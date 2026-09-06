import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1B2A41",
          50: "#EEF1F5",
          100: "#DCE2EA",
          200: "#B4C0D1",
          300: "#8C9EB8",
          400: "#5E7292",
          500: "#3A4E6B",
          600: "#293C56",
          700: "#1B2A41",
          800: "#131E2E",
          900: "#0B111A",
        },
        sand: {
          DEFAULT: "#F6F4EF",
          100: "#FCFBF9",
          200: "#F6F4EF",
          300: "#EDE9DF",
          400: "#DCD5C4",
        },
        graystone: {
          DEFAULT: "#5B5F66",
          light: "#8A8E94",
          dark: "#33363B",
        },
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;
