import type { GridState } from '../types/grid'
import { gridIndex } from '../types/grid'
import { isLightColor } from '../color/rgb'

export type ColorLabelMode = 'cell' | 'region'

export function drawColorLabels(
  ctx: CanvasRenderingContext2D,
  grid: GridState,
  getHex: (colorId: string) => string,
  offsetX: number,
  offsetY: number,
  cellSize: number,
  scale = 1,
  mode: ColorLabelMode = 'region',
) {
  if (mode === 'cell') {
    drawColorLabelsPerCell(ctx, grid, getHex, offsetX, offsetY, cellSize, scale)
    return
  }

  const minCellsForLabel = 4
  const visited = new Set<number>()
  const fontSize = Math.min(cellSize * 0.5, 12 * scale)

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const idx = gridIndex(x, y, grid.width)
      if (visited.has(idx)) continue
      const colorId = grid.cells[idx].colorId
      if (!colorId) continue

      const region = floodRegion(grid, x, y, colorId, visited)
      if (region.length < minCellsForLabel) continue

      let cx = 0
      let cy = 0
      for (const p of region) {
        cx += p.x
        cy += p.y
      }
      cx = offsetX + (cx / region.length + 0.5) * cellSize
      cy = offsetY + (cy / region.length + 0.5) * cellSize

      drawLabel(ctx, colorId, getHex(colorId), cx, cy, fontSize)
    }
  }
}

function drawColorLabelsPerCell(
  ctx: CanvasRenderingContext2D,
  grid: GridState,
  getHex: (colorId: string) => string,
  offsetX: number,
  offsetY: number,
  cellSize: number,
  scale: number,
) {
  const fontSize = Math.min(cellSize * 0.45, 11 * scale)

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const colorId = grid.cells[gridIndex(x, y, grid.width)].colorId
      if (!colorId) continue

      const cx = offsetX + (x + 0.5) * cellSize
      const cy = offsetY + (y + 0.5) * cellSize
      drawLabel(ctx, colorId, getHex(colorId), cx, cy, fontSize)
    }
  }
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  colorId: string,
  hex: string,
  x: number,
  y: number,
  fontSize: number,
) {
  ctx.fillStyle = isLightColor(hex) ? '#333' : '#fff'
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(colorId, x, y)
}

function floodRegion(
  grid: GridState,
  startX: number,
  startY: number,
  colorId: string,
  globalVisited: Set<number>,
): { x: number, y: number }[] {
  const region: { x: number, y: number }[] = []
  const queue = [{ x: startX, y: startY }]
  const localVisited = new Set<number>()

  while (queue.length > 0) {
    const { x, y } = queue.shift()!
    const idx = gridIndex(x, y, grid.width)
    if (localVisited.has(idx)) continue
    if (grid.cells[idx].colorId !== colorId) continue

    localVisited.add(idx)
    globalVisited.add(idx)
    region.push({ x, y })

    if (x > 0) queue.push({ x: x - 1, y })
    if (x < grid.width - 1) queue.push({ x: x + 1, y })
    if (y > 0) queue.push({ x, y: y - 1 })
    if (y < grid.height - 1) queue.push({ x, y: y + 1 })
  }
  return region
}
