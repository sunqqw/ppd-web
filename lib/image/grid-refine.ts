import type { GridState } from '../types/grid'
import { gridIndex, isInGrid } from '../types/grid'
import type { PaletteMatcher } from '../color/palette-matcher'
import { getColorIdRole } from './color-role'
import { rgbDistanceSq, toleranceToDistanceSq } from '../color/rgb'
import { getNeighbors4 } from '../grid/grid-utils'

/** 仅合并填充色小区域，不触碰描边色 */
export function mergeFillRegions(
  grid: GridState,
  matcher: PaletteMatcher,
  mergeThreshold: number,
  minRegionSize: number,
): void {
  const maxDistSq = toleranceToDistanceSq(mergeThreshold)
  const { width, height, cells } = grid
  const total = width * height
  const visited = new Uint8Array(total)
  const queue = new Int32Array(total)
  const region = new Int32Array(total)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = gridIndex(x, y, width)
      if (visited[idx]) continue

      const startColorId = cells[idx].colorId
      if (!startColorId || getColorIdRole(matcher, startColorId) !== 'fill') {
        visited[idx] = 1
        continue
      }

      const startRgb = matcher.getRgb(startColorId)
      let regionLen = 0
      let head = 0
      let tail = 0
      queue[tail++] = idx

      while (head < tail) {
        const ci = queue[head++]
        if (visited[ci]) continue

        const cellColorId = cells[ci].colorId
        if (!cellColorId || getColorIdRole(matcher, cellColorId) !== 'fill') {
          visited[ci] = 1
          continue
        }

        if (rgbDistanceSq(startRgb, matcher.getRgb(cellColorId)) > maxDistSq) continue

        visited[ci] = 1
        region[regionLen++] = ci

        const cx = ci % width
        const cy = (ci / width) | 0
        for (const n of getNeighbors4(cx, cy)) {
          if (!isInGrid(n.x, n.y, grid)) continue
          const ni = gridIndex(n.x, n.y, width)
          if (!visited[ni]) queue[tail++] = ni
        }
      }

      if (regionLen === 0) continue

      const colorFreq = new Map<string, number>()
      for (let i = 0; i < regionLen; i++) {
        const cid = cells[region[i]].colorId!
        colorFreq.set(cid, (colorFreq.get(cid) ?? 0) + 1)
      }

      let dominantColorId = startColorId
      let maxCount = 0
      for (const [cid, count] of colorFreq) {
        if (count > maxCount) {
          maxCount = count
          dominantColorId = cid
        }
      }

      if (regionLen < minRegionSize) {
        dominantColorId = findNeighborFillDominant(cells, region, regionLen, width, height, matcher) ?? dominantColorId
      }

      for (let i = 0; i < regionLen; i++) {
        cells[region[i]].colorId = dominantColorId
      }
    }
  }
}

function findNeighborFillDominant(
  cells: GridState['cells'],
  region: Int32Array,
  regionLen: number,
  width: number,
  height: number,
  matcher: PaletteMatcher,
): string | null {
  const regionSet = new Set<number>()
  for (let i = 0; i < regionLen; i++) regionSet.add(region[i])

  const neighborFreq = new Map<string, number>()

  for (let i = 0; i < regionLen; i++) {
    const idx = region[i]
    const x = idx % width
    const y = (idx / width) | 0
    for (const n of getNeighbors4(x, y)) {
      if (n.x < 0 || n.y < 0 || n.x >= width || n.y >= height) continue
      const ni = gridIndex(n.x, n.y, width)
      if (regionSet.has(ni)) continue
      const cid = cells[ni].colorId
      if (!cid || getColorIdRole(matcher, cid) !== 'fill') continue
      neighborFreq.set(cid, (neighborFreq.get(cid) ?? 0) + 1)
    }
  }

  let best: string | null = null
  let bestCount = 0
  for (const [cid, count] of neighborFreq) {
    if (count > bestCount) {
      bestCount = count
      best = cid
    }
  }
  return best
}

/** 仅移除完全孤立的填充色单格，不删除描边 */
export function removeIsolatedFillSpecks(grid: GridState, matcher: PaletteMatcher): void {
  const { width, height, cells } = grid

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = gridIndex(x, y, width)
      const colorId = cells[idx].colorId
      if (!colorId || getColorIdRole(matcher, colorId) !== 'fill') continue

      let hasColoredNeighbor = false
      for (const n of getNeighbors4(x, y)) {
        if (n.x < 0 || n.y < 0 || n.x >= width || n.y >= height) continue
        if (cells[gridIndex(n.x, n.y, width)].colorId) {
          hasColoredNeighbor = true
          break
        }
      }

      if (!hasColoredNeighbor) {
        cells[idx].colorId = null
      }
    }
  }
}
