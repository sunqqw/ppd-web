import type { Palette, PaletteColorRaw } from '../types/palette'
import type { Rgb } from './rgb'
import { hexToRgb, packRgb, rgbDistanceSq } from './rgb'

interface PaletteColorEntry extends PaletteColorRaw {
  r: number
  g: number
  b: number
}

export class PaletteMatcher {
  private readonly colors: PaletteColorEntry[]
  private readonly hexById: Map<string, string>
  private readonly rgbById: Map<string, Rgb>
  private readonly nearestCache = new Map<number, string>()

  constructor(palette: Palette) {
    this.colors = palette.colors.map((c) => {
      const { r, g, b } = hexToRgb(c.hex)
      return { id: c.id, hex: c.hex, r, g, b }
    })
    this.hexById = new Map(this.colors.map(c => [c.id, c.hex]))
    this.rgbById = new Map(this.colors.map(c => [c.id, { r: c.r, g: c.g, b: c.b }]))
  }

  findNearest(r: number, g: number, b: number): string {
    const cacheKey = packRgb(r, g, b)
    const cached = this.nearestCache.get(cacheKey)
    if (cached !== undefined) return cached

    let bestId = this.colors[0]?.id ?? ''
    let bestDist = Infinity
    const target = { r, g, b }
    for (const c of this.colors) {
      const dist = rgbDistanceSq(target, c)
      if (dist < bestDist) {
        bestDist = dist
        bestId = c.id
      }
    }
    this.nearestCache.set(cacheKey, bestId)
    return bestId
  }

  findNearestHex(hex: string): string {
    const { r, g, b } = hexToRgb(hex)
    return this.findNearest(r, g, b)
  }

  getHex(colorId: string): string {
    return this.hexById.get(colorId) ?? '#000000'
  }

  getRgb(colorId: string): Rgb {
    return this.rgbById.get(colorId) ?? { r: 0, g: 0, b: 0 }
  }

  getColorMap(): Map<string, string> {
    return new Map(this.hexById)
  }
}
