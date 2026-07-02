import type { GridState } from '../types/grid'
import { cloneGrid } from '../types/grid'
import type { ImagePipelineParams } from '../types/grid'
import type { PaletteColor } from '../types/palette'
import { removeBackground } from './background-remove'
import { quantizeImage } from './quantize'
import { sampleToGrid } from './sample-grid'
import { repairExteriorOutline } from './grid-outline'
import { mergeFillRegions, removeIsolatedFillSpecks } from './grid-refine'
import { PaletteMatcher } from '../color/palette-matcher'

export interface ImageDataPlain {
  width: number
  height: number
  data: Uint8ClampedArray
}

export function imageDataToPlain(imageData: ImageData): ImageDataPlain {
  return {
    width: imageData.width,
    height: imageData.height,
    data: new Uint8ClampedArray(imageData.data),
  }
}

export function plainToImageData(plain: ImageDataPlain): ImageData {
  return new ImageData(plain.data, plain.width, plain.height)
}

export interface ProcessImagePayload {
  imageData: ImageDataPlain
  targetWidth: number
  targetHeight: number
  params: ImagePipelineParams
  paletteColors: PaletteColor[]
}

export interface ProcessImageResult {
  cells: { colorId: string | null }[]
  stats: { colorCount: number, processingMs: number }
}

export function processImage(payload: ProcessImagePayload): ProcessImageResult {
  const start = performance.now()
  let imageData = plainToImageData(payload.imageData)
  const { targetWidth, targetHeight, params, paletteColors } = payload

  const palette = {
    key: 'worker',
    name: 'worker',
    info: '',
    colors: paletteColors,
  }
  const matcher = new PaletteMatcher(palette)

  if (params.removeBackground) {
    imageData = removeBackground(imageData, params.bgTolerance)
  }

  const quantized = quantizeImage(imageData, matcher)
  const cells = sampleToGrid(quantized, targetWidth, targetHeight, params.detail, matcher)

  const grid: GridState = {
    width: targetWidth,
    height: targetHeight,
    cells: cells.map(c => ({ ...c })),
  }

  repairExteriorOutline(grid, matcher)

  if (params.mergeThreshold > 0) {
    mergeFillRegions(grid, matcher, params.mergeThreshold, params.minRegionSize)
  }

  removeIsolatedFillSpecks(grid, matcher)

  const colorSet = new Set<string>()
  for (const cell of grid.cells) {
    if (cell.colorId) colorSet.add(cell.colorId)
  }

  return {
    cells: grid.cells,
    stats: {
      colorCount: colorSet.size,
      processingMs: Math.round(performance.now() - start),
    },
  }
}

export function applyMergeToGrid(
  grid: GridState,
  paletteColors: PaletteColor[],
  mergeThreshold: number,
  minRegionSize: number,
): GridState {
  const result = cloneGrid(grid)
  const matcher = new PaletteMatcher({
    key: 'merge',
    name: 'merge',
    info: '',
    colors: paletteColors,
  })
  mergeFillRegions(result, matcher, mergeThreshold, minRegionSize)
  removeIsolatedFillSpecks(result, matcher)
  return result
}
