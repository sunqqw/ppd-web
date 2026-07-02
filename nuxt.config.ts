// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-03-12',
  ssr: false,
  nitro: {
    preset: 'static',
  },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/styles/main.css'],
  vite: {
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      include: ['naive-ui', 'vueuc', 'date-fns-tz/esm/formatInTimeZone'],
    },
  },
  build: {
    transpile: ['naive-ui', 'vueuc'],
  },
  app: {
    head: {
      title: '拼豆图纸生成器',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '免费在线拼豆图纸生成工具，智能像素化、色号匹配、导出打印' },
      ],
    },
  },
})
