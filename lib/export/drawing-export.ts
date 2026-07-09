import type { GridState } from '../types/grid'
import type { DrawingExportOptions } from '../types/export'
import type { PaletteMatcher } from '../color/palette-matcher'
import { gridIndex } from '../types/grid'
import { drawColorLabels } from '../canvas/color-labels'
import { drawCoordinateLabels } from '../canvas/coordinate-labels'

export async function exportDrawing(
  grid: GridState,
  matcher: PaletteMatcher,
  options: DrawingExportOptions,
): Promise<Blob> {
  const cellSize = 20 * options.scale
  const padding = 40 * options.scale
  const legendHeight = options.showLegend ? computeLegendHeight(grid, matcher, options.scale) : 0
  const labelHeight = options.showSizeLabel ? 30 * options.scale : 0
  const coordBand = options.showCoordinates
    ? Math.max(14 * options.scale, cellSize * 0.7)
    : 0

  const canvasW = grid.width * cellSize + padding * 2 + coordBand * 2
  const canvasH = grid.height * cellSize + padding * 2 + labelHeight + legendHeight + coordBand * 2

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasW, canvasH)

  if (options.showSizeLabel) {
    ctx.fillStyle = '#333'
    ctx.font = `${14 * options.scale}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`${grid.width}×${grid.height}`, canvasW / 2, padding + 20 * options.scale)
  }

  const offsetX = padding + coordBand
  const offsetY = padding + labelHeight + coordBand

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.cells[gridIndex(x, y, grid.width)]
      const px = offsetX + x * cellSize
      const py = offsetY + y * cellSize

      if (cell.colorId) {
        ctx.fillStyle = matcher.getHex(cell.colorId)
        ctx.fillRect(px, py, cellSize, cellSize)
      }

      if (options.showGrid) {
        ctx.strokeStyle = '#cccccc'
        ctx.lineWidth = 1
        ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1)
      }
    }
  }

  if (options.showColorLabels) {
    drawColorLabels(ctx, grid, id => matcher.getHex(id), offsetX, offsetY, cellSize, options.scale, 'cell')
  }

  if (options.showCoordinates) {
    drawCoordinateLabels(ctx, grid.width, grid.height, offsetX, offsetY, cellSize, options.scale)
  }

  if (options.showLegend) {
    drawLegend(
      ctx,
      grid,
      matcher,
      padding,
      offsetY + grid.height * cellSize + coordBand + 20 * options.scale,
      options.scale,
    )
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('导出失败')),
      options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
      0.95,
    )
  })
}

function computeLegendHeight(grid: GridState, matcher: PaletteMatcher, scale: number): number {
  const usedColors = new Set<string>()
  for (const cell of grid.cells) {
    if (cell.colorId) usedColors.add(cell.colorId)
  }
  const rows = Math.ceil(usedColors.size / 4)
  return rows * 30 * scale + 40 * scale
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  grid: GridState,
  matcher: PaletteMatcher,
  padding: number,
  startY: number,
  scale: number,
) {
  const counts = new Map<string, number>()
  for (const cell of grid.cells) {
    if (!cell.colorId) continue
    counts.set(cell.colorId, (counts.get(cell.colorId) ?? 0) + 1)
  }

  const items = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const colWidth = 150 * scale
  const rowHeight = 28 * scale

  ctx.fillStyle = '#333'
  ctx.font = `bold ${14 * scale}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('色号图例', padding, startY)

  items.forEach(([colorId, count], i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    const x = padding + col * colWidth
    const y = startY + 20 * scale + row * rowHeight

    ctx.fillStyle = matcher.getHex(colorId)
    ctx.fillRect(x, y, 18 * scale, 18 * scale)
    ctx.strokeStyle = '#ccc'
    ctx.strokeRect(x, y, 18 * scale, 18 * scale)

    ctx.fillStyle = '#333'
    ctx.font = `${12 * scale}px sans-serif`
    ctx.fillText(`${colorId} (${count})`, x + 24 * scale, y + 14 * scale)
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
