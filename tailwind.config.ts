import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#E8ECEC",
        panel: "#F8FAFA",
        ink: "#14232B",
        ink2: "#4C5E67",
        line: "#C9D2D4",
        soft: "#EEF2F2",
        accent: "#0B5C6B",
      },
      fontFamily: {
        cond: ['"Barlow Condensed"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
