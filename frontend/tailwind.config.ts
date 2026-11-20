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
        alabaster: "#F5F3EE",
        stone: {
          DEFAULT: "#ECE8DF",
          subtle: "#E4DFC",
        },
        carbon: {
          DEFAULT: "#121211",
          hover: "#222220",
        },
        ink: {
          primary: "#141413",
          muted: "#68645B",
          subtle: "#8A857A",
        },
        rule: {
          hairline: "#D6D1C7",
          dark: "#2E2D2A",
        },
        sage: {
          DEFAULT: "#1F6346",
          subtle: "#EBF3EE",
          border: "#7EA993",
        },
        vermilion: {
          DEFAULT: "#D14326",
          subtle: "#FAECE8",
          border: "#E99583",
        },
        ochre: {
          DEFAULT: "#B87218",
          subtle: "#F9F2E7",
          border: "#D9AB6D",
        },
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        sans: ["var(--font-plus-jakarta)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains)", "Courier New", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.03em",
        tighter: "-0.02em",
        widest: "0.15em",
        ultra: "0.20em",
      },
    },
  },
  plugins: [],
};

export default config;
