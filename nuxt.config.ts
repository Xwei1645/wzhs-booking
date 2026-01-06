export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'WZHS Booking',
      titleTemplate: '%s | WZHS Booking'
    }
  },
  modules: [
    '@tdesign-vue-next/nuxt'
  ],
  tdesign: {
    resolveIcons: true,
    plugins: ['MessagePlugin', 'DialogPlugin']
  }
});