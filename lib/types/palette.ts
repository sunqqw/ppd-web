export interface PaletteColor {
  id: string
  hex: string
  series: string
  seriesName: string
}

export interface Palette {
  key: string
  name: string
  info: string
  colors: PaletteColor[]
  /** 是否为自定义色号库 */
  isCustom?: boolean
  /** 自定义库所基于的内置色号库 key */
  basePaletteKey?: string
  /** 自定义库记录 ID */
  customId?: string
}

/** 持久化在 LocalStorage 的自定义色号库记录 */
export interface CustomPaletteRecord {
  id: string
  name: string
  basePaletteKey: string
  colorIds: string[]
  createdAt: number
  updatedAt: number
}

export interface PaletteColorRaw {
  id: string
  hex: string
  r: number
  g: number
  b: number
}
