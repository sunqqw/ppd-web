import type { GridState } from '../types/grid'
import { gridIndex } from '../types/grid'
import type { PaletteMatcher } from '../color/palette-matcher'
import { getColorIdRole, pickOutlineColorId } from './color-role'
import { getNeighbors4 } from '../grid/grid-utils'

/** 标记与网格外侧连通的所有空白格 */
function markExteriorNulls(grid: GridState): Uint8Array {
  const { width, height, cells } = grid
  const total = width * height
  const exterior = new Uint8Array(total)
  const queue: number[] = []

  for (let x = 0; x < width; x++) {
    queue.push(x)
    queue.push((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y++) {
    queue.push(y * width)
    queue.push(y * width + width - 1)
  }

  while (queue.length > 0) {
    const idx = queue.pop()!
    if (exterior[idx]) continue
    if (cells[idx].colorId) continue

    exterior[idx] = 1
    const x = idx % width
    const y = (idx / width) | 0
    for (const n of getNeighbors4(x, y)) {
      if (n.x < 0 || n.y < 0 || n.x >= width || n.y >= height) continue
      const ni = gridIndex(n.x, n.y, width)
      if (!exterior[ni] && !cells[ni].colorId) queue.push(ni)
    }
  }

  return exterior
}

/**
 * 将贴靠外侧背景的填充色格转为描边色，补全缺失轮廓。
 * 不处理眼睛等内部镂空（内侧空白不视为外侧）。
 */
export function repairExteriorOutline(grid: GridState, matcher: PaletteMatcher): void {
  const { width, height, cells } = grid
  const exterior = markExteriorNulls(grid)
  const outlineColorId = pickOutlineColorId(grid, matcher)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = gridIndex(x, y, width)
      const colorId = cells[idx].colorId
      if (!colorId || getColorIdRole(matcher, colorId) !== 'fill') continue

      for (const n of getNeighbors4(x, y)) {
        if (n.x < 0 || n.y < 0 || n.x >= width || n.y >= height) {
          cells[idx].colorId = outlineColorId
          break
        }
        const ni = gridIndex(n.x, n.y, width)
        if (!cells[ni].colorId && exterior[ni]) {
          cells[idx].colorId = outlineColorId
          break
        }
      }
    }
  }
}
