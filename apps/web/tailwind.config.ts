import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark theme colors - Techy, sleek, professional
        background: {
          DEFAULT: "#0f1115",
          secondary: "#1a1d24",
          tertiary: "#222529",
        },
        surface: {
          DEFAULT: "#2b2f36",
          hover: "#353941",
          active: "#3d4149",
        },
        text: {
          DEFAULT: "#e8edf2",
          secondary: "#b8bec4",
          muted: "#888d93",
          dim: "#5a5f65",
        },
        accent: {
          cyan: "#00d4ff",
          teal: "#00c9a7",
          indigo: "#7b61ff",
          purple: "#c77dff",
          blue: "#4d96ff",
        },
        // Log level colors
        level: {
          trace: "#888d93", // Muted grey
          debug: "#4d96ff", // Blue
          info: "#00c9a7", // Teal/green
          warn: "#ffa726", // Orange
          error: "#ff5757", // Red
        },
        error: "#ff5757",
        warning: "#ffa726",
        success: "#00c853",
        // Intent/tag colors
        tag: {
          blue: "#4d96ff",
          purple: "#c77dff",
          teal: "#00c9a7",
          cyan: "#00d4ff",
          pink: "#ff6ec7",
        },
      },
      borderRadius: {
        "2xl": "1rem",
      },
      // Mobile-first breakpoints from PRD
      screens: {
        xs: "320px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
      // Animations for smooth transitions
      animation: {
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
