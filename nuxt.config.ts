// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/ui'],
  runtimeConfig: {
    public: {
      JWT_SECRET: process.env.JWT_SECRET
    }
  }, 
  nitro: {
    storage: {
      data: { driver: 'fs', base: './data' }
    }, 
    routeRules: {
      '/api/**': { appMiddleware: 'auth' }
    }
  }

})