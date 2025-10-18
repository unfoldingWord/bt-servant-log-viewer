import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark theme colors matching ChessCoachAI
        background: {
          DEFAULT: "#0f1115",
          secondary: "#1a1d24",
          tertiary: "#222529",
        },
        surface: {
          DEFAULT: "#2b2f36",
          hover: "#353941",
        },
        text: {
          DEFAULT: "#e8edf2",
          secondary: "#b8bec4",
          muted: "#888d93",
        },
        accent: {
          cyan: "#00d4ff",
          teal: "#00c9a7",
          indigo: "#7b61ff",
        },
        error: "#ff5757",
        warning: "#ffa726",
        success: "#00c853",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
