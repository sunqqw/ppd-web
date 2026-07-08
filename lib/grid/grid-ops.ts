import type { GridCell, GridState } from '../types/grid'
import { gridIndex, isInGrid } from '../types/grid'
import { getNeighbors4 } from './grid-utils'

export function setCell(grid: GridState, x: number, y: number, colorId: string | null) {
  if (!isInGrid(x, y, grid)) return
  grid.cells[gridIndex(x, y, grid.width)].colorId = colorId
}

export function getCell(grid: GridState, x: number, y: number): GridCell | null {
  if (!isInGrid(x, y, grid)) return null
  return grid.cells[gridIndex(x, y, grid.width)]
}

export function floodFillGrid(
  grid: GridState,
  startX: number,
  startY: number,
  targetColorId: string | null,
  fillColorId: string | null,
): { x: number, y: number }[] {
  const start = getCell(grid, startX, startY)
  if (!start || start.colorId === fillColorId) return []

  const changed: { x: number, y: number }[] = []
  const queue: { x: number, y: number }[] = [{ x: startX, y: startY }]
  const visited = new Set<number>()
  let head = 0

  while (head < queue.length) {
    const { x, y } = queue[head++]
    const idx = gridIndex(x, y, grid.width)
    if (visited.has(idx)) continue
    const cell = grid.cells[idx]
    if (cell.colorId !== targetColorId) continue

    visited.add(idx)
    cell.colorId = fillColorId
    changed.push({ x, y })

    for (const n of getNeighbors4(x, y)) {
      if (isInGrid(n.x, n.y, grid)) queue.push(n)
    }
  }
  return changed
}

export function setCellsBatch(
  grid: GridState,
  positions: { x: number, y: number }[],
  colorId: string | null,
) {
  for (const { x, y } of positions) {
    setCell(grid, x, y, colorId)
  }
}

export function countColors(grid: GridState): Map<string, number> {
  const counts = new Map<string, number>()
  for (const cell of grid.cells) {
    if (!cell.colorId) continue
    counts.set(cell.colorId, (counts.get(cell.colorId) ?? 0) + 1)
  }
  return counts
}
