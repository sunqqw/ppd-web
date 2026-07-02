export default defineNuxtPlugin(() => {
  const customPaletteStore = useCustomPaletteStore()
  customPaletteStore.load()
})
