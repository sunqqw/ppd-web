export interface GridCell {
  colorId: string | null
}

export interface GridState {
  width: number
  height: number
  cells: GridCell[]
}

export interface ViewTransform {
  scale: number
  offsetX: number
  offsetY: number
  cellPixelSize: number
}

export interface ImagePipelineParams {
  detail: number
  removeBackground: boolean
  bgTolerance: number
  mergeThreshold: number
  minRegionSize: number
}

export const DEFAULT_IMAGE_PARAMS: ImagePipelineParams = {
  detail: 50,
  removeBackground: true,
  bgTolerance: 0,
  mergeThreshold: 15,
  minRegionSize: 2,
}

export function createEmptyGrid(width: number, height: number): GridState {
  return {
    width,
    height,
    cells: Array.from({ length: width * height }, () => ({ colorId: null })),
  }
}

export function cloneGrid(grid: GridState): GridState {
  return {
    width: grid.width,
    height: grid.height,
    cells: grid.cells.map(c => ({ ...c })),
  }
}

export function gridIndex(x: number, y: number, width: number): number {
  return y * width + x
}

export function isInGrid(x: number, y: number, grid: GridState): boolean {
  return x >= 0 && y >= 0 && x < grid.width && y < grid.height
}
