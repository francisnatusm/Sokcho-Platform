/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E3A5F",
          light: "#2E5A8F",
        },
        background: "#F8F9FA",
        surface: "#FFFFFF",
        "text-primary": "#1A1A2E",
        "text-secondary": "#6B7280",
        accent: "#3B82F6",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
