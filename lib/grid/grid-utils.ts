import type { ViewTransform } from '../types/grid'

export interface Point {
  x: number
  y: number
}

export function getNeighbors4(x: number, y: number): Point[] {
  return [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
  ]
}

export function screenToGrid(
  screenX: number,
  screenY: number,
  transform: ViewTransform,
  canvasRect: DOMRect,
  gridWidth: number,
  gridHeight: number,
): Point | null {
  const localX = screenX - canvasRect.left - transform.offsetX
  const localY = screenY - canvasRect.top - transform.offsetY
  const cellSize = transform.cellPixelSize * transform.scale
  const gx = Math.floor(localX / cellSize)
  const gy = Math.floor(localY / cellSize)
  if (gx < 0 || gy < 0 || gx >= gridWidth || gy >= gridHeight) return null
  return { x: gx, y: gy }
}

export function gridToScreen(
  gridX: number,
  gridY: number,
  transform: ViewTransform,
): Point {
  const cellSize = transform.cellPixelSize * transform.scale
  return {
    x: gridX * cellSize + transform.offsetX,
    y: gridY * cellSize + transform.offsetY,
  }
}

export function getGridContentSize(transform: ViewTransform, width: number, height: number) {
  const cellSize = transform.cellPixelSize * transform.scale
  return { width: width * cellSize, height: height * cellSize }
}
