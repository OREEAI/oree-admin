import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Admin accent — a deliberately distinct violet so the internal
        // console is never visually confused with the coral customer app.
        coral: {
          DEFAULT: "#7C5CFF",
          50: "#F1EEFF",
          100: "#E2DBFF",
          200: "#C4B6FF",
          300: "#A690FF",
          400: "#8E72FF",
          500: "#7C5CFF",
          600: "#5E3FE0",
          700: "#472FB0",
          800: "#32227E",
          900: "#1F154F",
        },
        // The shell chrome runs near-black so the admin app reads as a
        // darker, more serious surface than the white customer dashboard.
        navy: {
          DEFAULT: "#0A0E1A",
          50: "#E7E9EF",
          100: "#C5CAD7",
          200: "#9097A9",
          300: "#5E6478",
          400: "#3A4054",
          500: "#262B3D",
          600: "#1A1E2E",
          700: "#12162270",
          800: "#0F1320",
          900: "#0A0E1A",
        },
        ink: {
          DEFAULT: "#0A0E1A",
          muted: "#5E6478",
          soft: "#9097A9",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          soft: "#0F1320",
          softer: "#1A1E2E",
        },
        success: "#28C76F",
        warning: "#FF9F43",
      },
      fontFamily: {
        sans: ["var(--font-sora)", ...fontFamily.sans],
        code: ["var(--font-code)", "monospace"],
        grotesk: ["var(--font-grotesk)", ...fontFamily.sans],
      },
      letterSpacing: {
        tagline: "0.15em",
      },
      spacing: {
        0.25: "0.0625rem",
        7.5: "1.875rem",
        15: "3.75rem",
      },
      borderWidth: {
        DEFAULT: "0.0625rem",
      },
      backgroundImage: {
        "coral-gradient":
          "linear-gradient(135deg, #A690FF 0%, #7C5CFF 50%, #5E3FE0 100%)",
        "navy-gradient":
          "linear-gradient(135deg, #1A1E2E 0%, #0F1320 50%, #0A0E1A 100%)",
      },
      boxShadow: {
        "coral-glow": "0 0 80px rgba(124, 92, 255, 0.35)",
        "soft-lift":
          "0 1px 2px rgba(0, 0, 0, 0.25), 0 8px 24px rgba(0, 0, 0, 0.35)",
        "card-hover":
          "0 1px 2px rgba(0, 0, 0, 0.3), 0 16px 40px rgba(124, 92, 255, 0.18)",
      },
      transitionTimingFunction: {
        "smooth-out": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      zIndex: {
        1: "1",
        2: "2",
        5: "5",
      },
    },
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        ".container-narrow": {
          "@apply container max-w-5xl": {},
        },
        ".container-wide": {
          "@apply container max-w-7xl": {},
        },
        ".h1": {
          "@apply font-semibold text-[2.5rem] leading-[1.15] tracking-[-0.02em] md:text-[3.25rem] lg:text-[4rem] xl:text-[4.75rem]":
            {},
        },
        ".h2": {
          "@apply font-semibold text-[2rem] leading-[1.2] tracking-[-0.01em] md:text-[2.5rem] lg:text-[3rem]":
            {},
        },
        ".h3": {
          "@apply font-semibold text-[1.5rem] leading-[1.3] md:text-[1.875rem] lg:text-[2.25rem]":
            {},
        },
        ".h4": {
          "@apply font-semibold text-[1.25rem] leading-[1.35] md:text-[1.5rem]":
            {},
        },
        ".body-1": {
          "@apply text-[1rem] leading-[1.7] md:text-[1.125rem] md:leading-[1.75]":
            {},
        },
        ".body-2": {
          "@apply text-[0.9375rem] leading-[1.6] md:text-[1rem]": {},
        },
        ".caption": {
          "@apply text-sm leading-relaxed": {},
        },
        ".tagline": {
          "@apply font-grotesk font-medium text-xs uppercase tracking-tagline":
            {},
        },
        ".button-text": {
          "@apply font-code text-xs font-bold uppercase tracking-wider": {},
        },
      });
    }),
  ],
};

export default config;
