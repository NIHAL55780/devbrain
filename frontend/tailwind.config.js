/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        "neon-green": "#22f7b9",
        "neon-cyan": "#2df3ff"
      },
      boxShadow: {
        glow: "0 0 24px rgba(34, 247, 185, 0.25)"
      }
    }
  },
  plugins: []
};
