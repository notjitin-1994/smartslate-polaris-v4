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
        primary: {
          400: "#d0edf0",
          500: "#a7dadb",
          600: "#7bc5c7",
        },
        secondary: {
          400: "#7C69F5",
          500: "#4F46E5",
          600: "#3730A3",
          700: "#312E81",
        },
        brand: {
          bg: "#020C1B",
          surface: "rgba(13, 27, 42, 0.55)",
        }
      },
      fontFamily: {
        sans: ["var(--font-lato)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-quicksand)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
        glass: "18px",
      },
    },
  },
  plugins: [],
};
export default config;
