module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fredoka', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif']
      },
      colors: {
        ghibliBG: '#0b0f12',
        softGlass: 'rgba(255,255,255,0.06)'
      }
    }
  },
  plugins: []
}
