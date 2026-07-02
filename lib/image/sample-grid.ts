import type { GridCell } from '../types/grid'
import type { PaletteMatcher } from '../color/palette-matcher'
import { getColorIdRole } from './color-role'
import type { QuantizedImage } from './quantize'

interface BlockVote {
  outline: Map<string, number>
  fill: Map<string, number>
  opaque: number
  centerColorId: string
}

function collectBlockVotes(
  quantized: QuantizedImage,
  matcher: PaletteMatcher,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  centerX: number,
  centerY: number,
): BlockVote {
  const { width: srcW, colorIds } = quantized
  const outline = new Map<string, number>()
  const fill = new Map<string, number>()
  let opaque = 0

  const centerIdx = centerY * srcW + centerX
  const centerColorId = colorIds[centerIdx] ?? ''

  for (let y = startY; y < endY; y++) {
    const row = y * srcW
    for (let x = startX; x < endX; x++) {
      const colorId = colorIds[row + x]
      if (!colorId) continue

      opaque++
      const role = getColorIdRole(matcher, colorId)
      const bucket = role === 'outline' ? outline : role === 'fill' ? fill : null
      if (!bucket) continue
      bucket.set(colorId, (bucket.get(colorId) ?? 0) + 1)
    }
  }

  return { outline, fill, opaque, centerColorId }
}

function pickBestFromVotes(votes: Map<string, number>): string {
  let best = ''
  let bestCount = 0
  for (const [id, count] of votes) {
    if (count > bestCount) {
      bestCount = count
      best = id
    }
  }
  return best
}

function sumVotes(votes: Map<string, number>): number {
  let total = 0
  for (const count of votes.values()) total += count
  return total
}

/**
 * 分块降采样：描边色优先 + 中心像素兜底，保留细线条轮廓。
 */
export function sampleToGrid(
  quantized: QuantizedImage,
  targetWidth: number,
  targetHeight: number,
  detail: number,
  matcher: PaletteMatcher,
): GridCell[] {
  const { width: srcW, height: srcH } = quantized
  const cells: GridCell[] = new Array(targetWidth * targetHeight)
  const blockW = srcW / targetWidth
  const blockH = srcH / targetHeight

  // detail 越高，描边保留阈值越低（更容易保留细线）
  const outlineRatio = 0.14 - (detail / 100) * 0.1

  for (let gy = 0; gy < targetHeight; gy++) {
    const startY = Math.floor(gy * blockH)
    const endY = Math.min(Math.ceil((gy + 1) * blockH), srcH)
    const centerY = Math.min(Math.floor((gy + 0.5) * blockH), srcH - 1)

    for (let gx = 0; gx < targetWidth; gx++) {
      const startX = Math.floor(gx * blockW)
      const endX = Math.min(Math.ceil((gx + 1) * blockW), srcW)
      const centerX = Math.min(Math.floor((gx + 0.5) * blockW), srcW - 1)

      const block = collectBlockVotes(quantized, matcher, startX, endX, startY, endY, centerX, centerY)
      const cellIdx = gy * targetWidth + gx

      if (block.opaque === 0) {
        cells[cellIdx] = { colorId: null }
        continue
      }

      const bestOutline = pickBestFromVotes(block.outline)
      const bestFill = pickBestFromVotes(block.fill)
      const outlineTotal = sumVotes(block.outline)
      const fillTotal = sumVotes(block.fill)

      const outlineThreshold = Math.max(1, block.opaque * outlineRatio)

      if (bestOutline && outlineTotal >= outlineThreshold) {
        cells[cellIdx] = { colorId: bestOutline }
        continue
      }

      if (bestFill) {
        cells[cellIdx] = { colorId: bestFill }
        continue
      }

      if (bestOutline) {
        cells[cellIdx] = { colorId: bestOutline }
        continue
      }

      // 中心像素兜底（避免边缘块被误判为背景）
      if (block.centerColorId && getColorIdRole(matcher, block.centerColorId) !== 'background') {
        cells[cellIdx] = { colorId: block.centerColorId }
        continue
      }

      cells[cellIdx] = { colorId: null }
    }
  }

  return cells
}
