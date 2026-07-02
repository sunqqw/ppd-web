export function drawGridOverlay(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  ox: number,
  oy: number,
  cellSize: number,
  canvasW: number,
  canvasH: number,
) {
  ctx.clearRect(0, 0, canvasW, canvasH)
  ctx.strokeStyle = '#dddddd'
  ctx.lineWidth = 1

  for (let x = 0; x <= gridW; x++) {
    const px = ox + x * cellSize + 0.5
    ctx.beginPath()
    ctx.moveTo(px, oy)
    ctx.lineTo(px, oy + gridH * cellSize)
    ctx.stroke()
  }

  for (let y = 0; y <= gridH; y++) {
    const py = oy + y * cellSize + 0.5
    ctx.beginPath()
    ctx.moveTo(ox, py)
    ctx.lineTo(ox + gridW * cellSize, py)
    ctx.stroke()
  }
}

export function drawSelection(
  ctx: CanvasRenderingContext2D,
  selection: { x1: number, y1: number, x2: number, y2: number },
  ox: number,
  oy: number,
  cellSize: number,
) {
  ctx.strokeStyle = '#2080f0'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  const sx = ox + selection.x1 * cellSize
  const sy = oy + selection.y1 * cellSize
  const sw = (selection.x2 - selection.x1 + 1) * cellSize
  const sh = (selection.y2 - selection.y1 + 1) * cellSize
  ctx.strokeRect(sx, sy, sw, sh)
  ctx.setLineDash([])
}
