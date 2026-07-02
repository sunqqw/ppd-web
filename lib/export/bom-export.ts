import type { GridState } from '../types/grid'
import type { BomExportOptions, BomItem } from '../types/export'
import type { PaletteMatcher } from '../color/palette-matcher'
import { countColors } from '../grid/grid-ops'

export function computeBom(grid: GridState, matcher: PaletteMatcher): BomItem[] {
  const counts = countColors(grid)
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  const items: BomItem[] = []

  for (const [colorId, count] of counts) {
    items.push({
      colorId,
      hex: matcher.getHex(colorId),
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    })
  }

  return items
}

export async function exportBom(
  grid: GridState,
  matcher: PaletteMatcher,
  options: BomExportOptions,
): Promise<Blob> {
  const items = computeBom(grid, matcher)
  items.sort((a, b) =>
    options.sortBy === 'colorId'
      ? a.colorId.localeCompare(b.colorId)
      : b.count - a.count,
  )

  const total = items.reduce((s, i) => s + i.count, 0)
  const rowHeight = 36
  const headerHeight = 120
  const canvasW = 600
  const canvasH = headerHeight + items.length * rowHeight + 50

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasW, canvasH)

  ctx.fillStyle = '#1a1a1a'
  ctx.font = 'bold 22px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(options.title || '拼豆采购清单', 30, 40)

  ctx.font = '14px sans-serif'
  ctx.fillStyle = '#666'
  ctx.fillText(`图纸尺寸：${grid.width}×${grid.height}  |  总颗数：${total}  |  用色：${items.length}种`, 30, 70)
  ctx.fillText(`生成日期：${new Date().toLocaleDateString('zh-CN')}`, 30, 95)

  const cols = { swatch: 30, id: 100, count: 200, pct: 350 }
  let y = headerHeight
  ctx.fillStyle = '#eee'
  ctx.fillRect(20, y - 10, canvasW - 40, 30)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText('色块', cols.swatch, y + 10)
  ctx.fillText('色号', cols.id, y + 10)
  ctx.fillText('数量', cols.count, y + 10)
  ctx.fillText('占比', cols.pct, y + 10)
  y += 35

  ctx.font = '13px sans-serif'
  for (const item of items) {
    ctx.fillStyle = item.hex
    ctx.fillRect(cols.swatch, y, 24, 24)
    ctx.strokeStyle = '#ccc'
    ctx.strokeRect(cols.swatch, y, 24, 24)

    ctx.fillStyle = '#333'
    ctx.fillText(item.colorId, cols.id, y + 17)
    ctx.fillText(`${item.count} 颗`, cols.count, y + 17)
    ctx.fillText(`${item.percentage}%`, cols.pct, y + 17)
    y += rowHeight
  }

  ctx.fillStyle = '#333'
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText(`合计：${total} 颗`, 30, y + 10)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('导出失败')),
      'image/png',
    )
  })
}
