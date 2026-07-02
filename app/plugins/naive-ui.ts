import { create, NConfigProvider, NMessageProvider, NDialogProvider, zhCN, dateZhCN } from 'naive-ui'

const naive = create({
  components: [],
})

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(naive)
})

export { NConfigProvider, NMessageProvider, NDialogProvider, zhCN, dateZhCN }
