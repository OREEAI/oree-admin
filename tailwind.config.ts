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
        coral: {
          DEFAULT: "#F24E2E",
          50: "#FFF5F2",
          100: "#FFE4DC",
          200: "#FFC3B3",
          300: "#FF9E85",
          400: "#F87457",
          500: "#F24E2E",
          600: "#D33A1C",
          700: "#A92C13",
          800: "#7E200C",
          900: "#551507",
        },
        navy: {
          DEFAULT: "#0B2740",
          50: "#EEF3F8",
          100: "#D3DDE9",
          200: "#A8BAD0",
          300: "#7D95B6",
          400: "#52719C",
          500: "#2F4E77",
          600: "#1A3A5C",
          700: "#102F4E",
          800: "#0B2740",
          900: "#061A2B",
        },
        ink: {
          DEFAULT: "#0B2740",
          muted: "#6C7A86",
          soft: "#9BA6AF",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          soft: "#F3F5F7",
          softer: "#E3E7EB",
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
          "linear-gradient(135deg, #FF9E85 0%, #F24E2E 50%, #D33A1C 100%)",
        "navy-gradient":
          "linear-gradient(135deg, #1A3A5C 0%, #0B2740 50%, #061A2B 100%)",
        "conic-glow":
          "conic-gradient(from 180deg at 50% 50%, #F24E2E 0deg, #FF9F43 90deg, #F24E2E 180deg, #D33A1C 270deg, #F24E2E 360deg)",
        "radial-glow":
          "radial-gradient(ellipse at center, rgba(242, 78, 46, 0.15) 0%, rgba(255, 159, 67, 0.08) 40%, transparent 70%)",
        "benefit-card":
          "linear-gradient(180deg, rgba(242, 78, 46, 0.03) 0%, rgba(11, 39, 64, 0.02) 100%)",
      },
      boxShadow: {
        "coral-glow": "0 0 80px rgba(242, 78, 46, 0.35)",
        "soft-lift":
          "0 1px 2px rgba(11, 39, 64, 0.04), 0 8px 24px rgba(11, 39, 64, 0.06)",
        "card-hover":
          "0 1px 2px rgba(11, 39, 64, 0.06), 0 16px 40px rgba(242, 78, 46, 0.08)",
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
