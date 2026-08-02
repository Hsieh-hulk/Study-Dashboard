export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans TC"', 'sans-serif'],
      },
      screens: {
        'ipad-portrait': { 'raw': '(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)' },
        'ipad-landscape': { 'raw': '(min-width: 1024px) and (max-width: 1280px)' },
      }
    }
  },
  plugins: [],
}
