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
      }
    },
  },
  plugins: [],
}
