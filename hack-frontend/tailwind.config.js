/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',  // Deep Navy
        surface: '#1E293B',     // Card/Surface
        primary: '#6366F1',     // Indigo
        secondary: '#06B6D4',   // Cyan
        accent: '#F59E0B',      // Amber
        success: '#22C55E',     // Green
        error: '#EF4444',       // Red
        textPrimary: '#F1F5F9', // Soft White
        textMuted: '#94A3B8',   // Muted Slate Gray
        border: '#334155',      // Subtle Divider
      },
    },
  },
  plugins: [],
}
