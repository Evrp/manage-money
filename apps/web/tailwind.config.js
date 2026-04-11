/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        line: "#06C755",
        navy: "#1A1F36",
      },
      fontFamily: {
        thai: ['"IBM Plex Sans Thai"', "sans-serif"],
        sans: ['"IBM Plex Sans"', "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
