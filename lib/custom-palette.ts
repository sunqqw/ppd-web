import type { CustomPaletteRecord, Palette } from './types/palette'

export const CUSTOM_PALETTE_PREFIX = 'custom:'

export function customPaletteKey(id: string): string {
  return `${CUSTOM_PALETTE_PREFIX}${id}`
}

export function isCustomPaletteKey(key: string): boolean {
  return key.startsWith(CUSTOM_PALETTE_PREFIX)
}

export function parseCustomPaletteId(key: string): string | null {
  if (!isCustomPaletteKey(key)) return null
  return key.slice(CUSTOM_PALETTE_PREFIX.length)
}

export function buildPaletteFromCustom(
  record: CustomPaletteRecord,
  builtins: Palette[],
): Palette | null {
  const base = builtins.find(p => p.key === record.basePaletteKey)
  if (!base) return null

  const idSet = new Set(record.colorIds)
  const colors = base.colors.filter(c => idSet.has(c.id))
  if (colors.length === 0) return null

  return {
    key: customPaletteKey(record.id),
    name: record.name,
    info: `基于 ${base.name}，已选 ${colors.length} 色`,
    colors,
    isCustom: true,
    basePaletteKey: record.basePaletteKey,
    customId: record.id,
  }
}
