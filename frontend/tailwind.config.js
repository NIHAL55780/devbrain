/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#16181d",
          raised: "#1c1f26",
          overlay: "#22262e"
        },
        border: {
          DEFAULT: "#2d323c",
          subtle: "#232730"
        },
        accent: {
          DEFAULT: "#7c9cff",
          muted: "#5a7ad4"
        },
        ink: {
          DEFAULT: "#eceef2",
          muted: "#949bab",
          faint: "#636b78"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(255, 255, 255, 0.04)"
      }
    }
  },
  plugins: []
};
