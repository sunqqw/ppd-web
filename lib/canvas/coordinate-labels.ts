/**
 * 在网格四边外侧绘制 1-based 行列坐标。
 * - 上/下：列号 1…gridW，对齐每列中心
 * - 左/右：行号 1…gridH，对齐每行中心
 * ox/oy 为网格左上角；cellSize 为单格像素边长。
 */
export function drawCoordinateLabels(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  ox: number,
  oy: number,
  cellSize: number,
  scale: number = 1,
): void {
  if (gridW <= 0 || gridH <= 0 || cellSize <= 0) return

  const fontSize = Math.min(cellSize * 0.45, 11 * scale)
  const margin = cellSize * 0.55
  const gridPixelW = gridW * cellSize
  const gridPixelH = gridH * cellSize

  ctx.save()
  ctx.fillStyle = '#666'
  ctx.font = `${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let x = 0; x < gridW; x++) {
    const label = String(x + 1)
    const cx = ox + (x + 0.5) * cellSize
    ctx.fillText(label, cx, oy - margin)
    ctx.fillText(label, cx, oy + gridPixelH + margin)
  }

  for (let y = 0; y < gridH; y++) {
    const label = String(y + 1)
    const cy = oy + (y + 0.5) * cellSize
    ctx.fillText(label, ox - margin, cy)
    ctx.fillText(label, ox + gridPixelW + margin, cy)
  }

  ctx.restore()
}
