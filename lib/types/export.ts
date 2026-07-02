export interface DrawingExportOptions {
  showGrid: boolean
  showColorLabels: boolean
  showSizeLabel: boolean
  showLegend: boolean
  scale: 1 | 2 | 4
  format: 'png' | 'jpeg'
}

export interface BomItem {
  colorId: string
  hex: string
  count: number
  percentage: number
}

export interface BomExportOptions {
  title: string
  sortBy: 'count' | 'colorId'
}

export const DEFAULT_DRAWING_EXPORT: DrawingExportOptions = {
  showGrid: true,
  showColorLabels: true,
  showSizeLabel: true,
  showLegend: true,
  scale: 2,
  format: 'png',
}
