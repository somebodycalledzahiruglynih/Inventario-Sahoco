/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Dark theme palette ──
        surface: {
          DEFAULT: '#1a1a1a',
          2: '#242424',
          3: '#2e2e2e',
        },
        border: 'rgba(255,255,255,0.07)',
        // orange brand accents
        brand: {
          DEFAULT: '#f97316',
          light: '#fb923c',
          dark: '#ea580c',
          muted: 'rgba(249,115,22,0.15)',
        },
        // keep sahoco tokens for any remaining usages
        sahoco: {
          bg: '#0f0f0f',
          surface: '#1a1a1a',
          card: '#1a1a1a',
          beige: '#242424',
          beigeDark: '#2e2e2e',
          brown: '#94a3b8',
          brownDark: '#cbd5e1',
          brownDeep: '#f1f5f9',
          amber: '#f97316',
          amberLight: '#fb923c',
          amberSoft: 'rgba(249,115,22,0.15)',
        },
      },
      boxShadow: {
        'warm-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.4)',
        'warm-md': '0 8px 24px -4px rgba(0, 0, 0, 0.5)',
        'warm-lg': '0 16px 36px -6px rgba(0, 0, 0, 0.6)',
        'warm-glow': '0 0 20px -3px rgba(249, 115, 22, 0.35)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
