module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',  // This covers files inside the app directory
    './src/components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        KhmerMoul: 'Moul',
        NotoSansKhmer: 'Noto Sans Khmer',
      },
      borderColor: {
        border: 'hsl(var(--border))',
      },
      backgroundColor: {
        background: 'hsl(var(--background))',
      },
      textColor: {
        foreground: 'hsl(var(--foreground))',
      },
    },
  },
  plugins: [],
}
