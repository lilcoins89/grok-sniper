import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#080b0d", panel: "#101518", teal: "#2de2c2", violet: "#9b7cff" } } },
  plugins: [],
};

export default config;
