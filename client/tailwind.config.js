/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0e8407',   // Primary Green
          light: '#19a30f',     // Lighter Green
          dark: '#076b84',      // Teal Accent
        },
        neutral: {
          light: '#f8fafc',     // Light background
          dark: '#1e293b',      // Dark mode background
        }
      }
    },
  },
  plugins: [],
};
