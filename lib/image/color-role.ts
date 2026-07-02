import type { PaletteMatcher } from '../color/palette-matcher'

export type ColorRole = 'background' | 'outline' | 'fill'

export function getColorRole(r: number, g: number, b: number): ColorRole {
  const lum = (r * 299 + g * 587 + b * 114) / 1000
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max > 0 ? (max - min) / max : 0

  if (lum > 230 && sat < 0.18) return 'background'
  if (lum < 75 || (lum < 110 && sat < 0.25)) return 'outline'
  return 'fill'
}

export function getColorIdRole(matcher: PaletteMatcher, colorId: string): ColorRole {
  const { r, g, b } = matcher.getRgb(colorId)
  return getColorRole(r, g, b)
}

export function pickOutlineColorId(grid: { cells: { colorId: string | null }[] }, matcher: PaletteMatcher): string {
  const freq = new Map<string, number>()
  for (const cell of grid.cells) {
    if (!cell.colorId) continue
    if (getColorIdRole(matcher, cell.colorId) !== 'outline') continue
    freq.set(cell.colorId, (freq.get(cell.colorId) ?? 0) + 1)
  }
  let best = ''
  let bestCount = 0
  for (const [id, count] of freq) {
    if (count > bestCount) {
      bestCount = count
      best = id
    }
  }
  return best || matcher.findNearest(0, 0, 0)
}
