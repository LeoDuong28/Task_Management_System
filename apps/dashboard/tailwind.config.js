module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#1877F2",
          600: "#1565d8",
          700: "#1254b5",
          800: "#0f4493",
          900: "#0c3578",
        },
        surface: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Clash Display", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.08)",
        elevated:
          "0 8px 32px -8px rgba(0, 0, 0, 0.12), 0 16px 48px -16px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
