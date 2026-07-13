import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EDE7DA",
        "paper-dim": "#E2DAC9",
        ink: "#1A1713",
        "ink-soft": "#3A342C",
        oxblood: "#7A2E2E",
        gold: "#A88A4E",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Cormorant Garamond", "Georgia", "serif"],
        mono: ["DM Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
