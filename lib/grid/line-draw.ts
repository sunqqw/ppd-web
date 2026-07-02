export function bresenhamLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { x: number, y: number }[] {
  const points: { x: number, y: number }[] = []
  let dx = Math.abs(x1 - x0)
  let dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let x = x0
  let y = y0

  while (true) {
    points.push({ x, y })
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x += sx }
    if (e2 < dx) { err += dx; y += sy }
  }
  return points
}

export function brushStamp(
  cx: number,
  cy: number,
  size: number,
): { x: number, y: number }[] {
  const half = Math.floor(size / 2)
  const points: { x: number, y: number }[] = []
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      points.push({ x: cx + dx, y: cy + dy })
    }
  }
  return points
}
