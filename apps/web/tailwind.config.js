/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "rgb(var(--surface) / <alpha-value>)",
        gray: {
          50: "rgb(var(--canvas) / <alpha-value>)", 100: "rgb(var(--subtle) / <alpha-value>)",
          200: "rgb(var(--line) / <alpha-value>)", 300: "rgb(var(--muted) / <alpha-value>)",
          400: "rgb(var(--muted) / <alpha-value>)", 500: "rgb(var(--muted) / <alpha-value>)",
          600: "rgb(var(--muted) / <alpha-value>)", 700: "rgb(var(--ink) / <alpha-value>)",
          800: "rgb(var(--ink) / <alpha-value>)", 900: "rgb(var(--ink) / <alpha-value>)",
        },
        indigo: {
          50: "rgb(var(--brand-soft) / <alpha-value>)", 100: "rgb(var(--brand-soft) / <alpha-value>)",
          200: "rgb(var(--line) / <alpha-value>)", 300: "rgb(var(--brand) / <alpha-value>)",
          400: "rgb(var(--brand) / <alpha-value>)", 500: "rgb(var(--brand) / <alpha-value>)",
          600: "rgb(var(--brand) / <alpha-value>)", 700: "rgb(var(--brand-hover) / <alpha-value>)",
          900: "rgb(var(--ink) / <alpha-value>)", 950: "rgb(var(--ink) / <alpha-value>)",
        },
        line: "#06C755",
        navy: "#1A1F36",
      },
      fontFamily: {
        thai: ['"IBM Plex Sans Thai"', "sans-serif"],
        sans: ['"IBM Plex Sans Thai"', '"IBM Plex Sans"', "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
