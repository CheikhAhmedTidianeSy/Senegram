/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Couleurs Sénégal + palette moderne
        senegal: {
          green:  "#00853F", // vert drapeau
          yellow: "#FDEF42",
          red:    "#E31B23",
        },
        brand: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        ink: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          500: "#64748b",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Poppins"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: "0 2px 12px rgba(15, 23, 42, 0.06)",
        bubble: "0 1px 2px rgba(15, 23, 42, 0.08)",
      },
      animation: {
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite",
      },
      keyframes: {
        "pulse-ring": {
          "0%":   { transform: "scale(0.8)", opacity: "0.8" },
          "80%":  { transform: "scale(2.2)", opacity: "0" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
