import { defineStore } from 'pinia'
import type { Palette } from '../../lib/types/palette'
import { PaletteMatcher } from '../../lib/color/palette-matcher'
import { buildPaletteFromCustom } from '../../lib/custom-palette'
import { useCustomPaletteStore } from './customPalette'
import mard291 from '../../data/palettes/mard291.json'
import mard221 from '../../data/palettes/mard221.json'
import artkal from '../../data/palettes/artkal.json'
import artkalMini from '../../data/palettes/artkalMini.json'
import perler from '../../data/palettes/perler.json'
import hama from '../../data/palettes/hama.json'

const BUILTIN_PALETTES: Palette[] = [mard291, mard221, artkal, artkalMini, perler, hama] as Palette[]

export const usePaletteStore = defineStore('palette', {
  state: () => ({
    builtinPalettes: BUILTIN_PALETTES,
    activePaletteKey: 'mard291',
  }),

  getters: {
    customPalettes(): Palette[] {
      const customStore = useCustomPaletteStore()
      return customStore.items
        .map(record => buildPaletteFromCustom(record, this.builtinPalettes))
        .filter((palette): palette is Palette => palette !== null)
    },

    palettes(): Palette[] {
      return [...this.builtinPalettes, ...this.customPalettes]
    },

    activePalette(state): Palette {
      const palettes = (this as ReturnType<typeof usePaletteStore>).palettes
      return palettes.find(p => p.key === state.activePaletteKey) ?? palettes[0]
    },

    matcher(): PaletteMatcher {
      const palette = (this as ReturnType<typeof usePaletteStore>).activePalette
      return new PaletteMatcher(palette)
    },

    colorMap(): Map<string, string> {
      return (this as ReturnType<typeof usePaletteStore>).matcher.getColorMap()
    },
  },

  actions: {
    setActivePalette(key: string) {
      if (this.palettes.some(p => p.key === key)) {
        this.activePaletteKey = key
      }
    },
  },
})
